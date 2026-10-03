#!/usr/bin/env python3
"""
export_trocr_onnx.py — Export microsoft/trocr-small-printed to ONNX INT8
Uses torch.onnx.export directly (bypasses optimum compatibility issues with PyTorch 2.x)

Requirements:
    pip install transformers onnx onnxruntime torch pillow

Usage:
    python src/data-pipeline/export_trocr_onnx.py
"""

import os, sys, json
import torch
import numpy as np

MODEL_ID   = "microsoft/trocr-small-printed"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'models', 'trocr_onnx'))

def check_deps():
    missing = []
    for pkg in ['transformers', 'onnx', 'onnxruntime', 'torch', 'PIL']:
        try:
            __import__('PIL' if pkg == 'PIL' else pkg)
        except ImportError:
            missing.append('pillow' if pkg == 'PIL' else pkg)
    if missing:
        print(f"Install missing packages: pip install {' '.join(missing)}")
        sys.exit(1)

def main():
    check_deps()

    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    import onnx
    from onnxruntime.quantization import quantize_dynamic, QuantType

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output → {OUTPUT_DIR}")
    print(f"\n[1/6] Loading {MODEL_ID} from HuggingFace…")
    print("      (First run downloads ~330MB — please wait)")

    processor = TrOCRProcessor.from_pretrained(MODEL_ID)
    model     = VisionEncoderDecoderModel.from_pretrained(MODEL_ID)
    model.eval()

    print(f"      Model loaded. Encoder: {type(model.encoder).__name__}, Decoder: {type(model.decoder).__name__}")

    # ── 2. Export ENCODER ──────────────────────────────────────────────
    print("\n[2/6] Exporting encoder to ONNX…")

    enc_fp32 = os.path.join(OUTPUT_DIR, "encoder_model.onnx")

    # Dummy input: [batch=1, channels=3, height=384, width=384]
    dummy_pixel = torch.randn(1, 3, 384, 384)

    class EncoderWrapper(torch.nn.Module):
        def __init__(self, enc):
            super().__init__()
            self.enc = enc
        def forward(self, pixel_values):
            return self.enc(pixel_values=pixel_values).last_hidden_state

    enc_wrapper = EncoderWrapper(model.encoder)

    with torch.no_grad():
        torch.onnx.export(
            enc_wrapper,
            (dummy_pixel,),
            enc_fp32,
            opset_version=14,
            input_names=['pixel_values'],
            output_names=['last_hidden_state'],
            dynamic_axes={
                'pixel_values':     {0: 'batch'},
                'last_hidden_state':{0: 'batch'},
            },
            do_constant_folding=True,
        )
    print(f"      Saved {_mb(enc_fp32):.1f} MB")

    # ── 3. Export DECODER ──────────────────────────────────────────────
    print("\n[3/6] Exporting decoder to ONNX…")

    dec_fp32 = os.path.join(OUTPUT_DIR, "decoder_model.onnx")

    # Dummy inputs for decoder
    seq_len    = 5
    hidden_dim = model.encoder.config.hidden_size
    dummy_ids  = torch.zeros(1, seq_len, dtype=torch.long)
    dummy_enc  = torch.randn(1, (384//16)**2 + 1, hidden_dim)  # ViT patch tokens

    class DecoderWrapper(torch.nn.Module):
        def __init__(self, dec, config):
            super().__init__()
            self.dec    = dec
            self.config = config
        def forward(self, input_ids, encoder_hidden_states):
            out = self.dec(
                input_ids=input_ids,
                encoder_hidden_states=encoder_hidden_states,
                use_cache=False,
            )
            return out.logits

    dec_wrapper = DecoderWrapper(model.decoder, model.config)

    with torch.no_grad():
        torch.onnx.export(
            dec_wrapper,
            (dummy_ids, dummy_enc),
            dec_fp32,
            opset_version=14,
            input_names=['input_ids', 'encoder_hidden_states'],
            output_names=['logits'],
            dynamic_axes={
                'input_ids':             {0: 'batch', 1: 'seq_len'},
                'encoder_hidden_states': {0: 'batch', 1: 'enc_seq'},
                'logits':                {0: 'batch', 1: 'seq_len'},
            },
            do_constant_folding=True,
        )
    print(f"      Saved {_mb(dec_fp32):.1f} MB")

    # ── 4. Validate ONNX models ────────────────────────────────────────
    print("\n[4/6] Validating ONNX models…")
    import onnxruntime as ort

    enc_sess = ort.InferenceSession(enc_fp32, providers=['CPUExecutionProvider'])
    enc_out  = enc_sess.run(None, {'pixel_values': dummy_pixel.numpy()})[0]
    print(f"      ✓ Encoder output shape: {enc_out.shape}")

    dec_sess = ort.InferenceSession(dec_fp32, providers=['CPUExecutionProvider'])
    dec_out  = dec_sess.run(None, {
        'input_ids':             dummy_ids.numpy(),
        'encoder_hidden_states': enc_out[:, :dummy_enc.shape[1], :] if enc_out.shape[1] >= dummy_enc.shape[1] else enc_out,
    })[0]
    print(f"      ✓ Decoder output shape: {dec_out.shape} (vocab_size={dec_out.shape[-1]})")

    # ── 5. INT8 Quantisation ───────────────────────────────────────────
    print("\n[5/6] Quantising to INT8…")

    enc_int8 = os.path.join(OUTPUT_DIR, "encoder_model_int8.onnx")
    dec_int8 = os.path.join(OUTPUT_DIR, "decoder_model_int8.onnx")

    quantize_dynamic(enc_fp32, enc_int8, weight_type=QuantType.QInt8)
    quantize_dynamic(dec_fp32, dec_int8, weight_type=QuantType.QInt8)

    print(f"      encoder: {_mb(enc_fp32):.1f} MB → {_mb(enc_int8):.1f} MB INT8")
    print(f"      decoder: {_mb(dec_fp32):.1f} MB → {_mb(dec_int8):.1f} MB INT8")

    # ── 6. Save configs + vocab ────────────────────────────────────────
    print("\n[6/6] Saving processor config + tokenizer vocab…")

    # Processor config (mean/std for normalisation)
    ip  = processor.image_processor
    cfg = {
        "image_mean": list(ip.image_mean),
        "image_std":  list(ip.image_std),
        "size":       {"height": 384, "width": 384},
    }
    with open(os.path.join(OUTPUT_DIR, "processor_config.json"), "w") as f:
        json.dump(cfg, f, indent=2)

    # Save full tokenizer
    processor.tokenizer.save_pretrained(OUTPUT_DIR)

    # id2token.json — simple reverse vocab for JS decoding
    vocab   = processor.tokenizer.get_vocab()
    id2tok  = {str(v): k for k, v in vocab.items()}
    with open(os.path.join(OUTPUT_DIR, "id2token.json"), "w", encoding="utf-8") as f:
        json.dump(id2tok, f, ensure_ascii=False)

    # Save special token ids
    special = {
        "bos_token_id": processor.tokenizer.bos_token_id,
        "eos_token_id": processor.tokenizer.eos_token_id,
        "pad_token_id": processor.tokenizer.pad_token_id,
        "vocab_size":   processor.tokenizer.vocab_size,
    }
    with open(os.path.join(OUTPUT_DIR, "special_tokens.json"), "w") as f:
        json.dump(special, f, indent=2)

    print(f"      Vocab size: {len(vocab)}")
    print(f"      BOS={special['bos_token_id']}  EOS={special['eos_token_id']}  PAD={special['pad_token_id']}")

    # ── Final summary ──────────────────────────────────────────────────
    print("\n── Output files ────────────────────────────────────────────")
    keep = ['encoder_model_int8.onnx', 'decoder_model_int8.onnx',
            'processor_config.json', 'id2token.json', 'special_tokens.json',
            'tokenizer.json', 'vocab.json', 'merges.txt']
    for fn in sorted(os.listdir(OUTPUT_DIR)):
        size = os.path.getsize(os.path.join(OUTPUT_DIR, fn))
        mark = "✓" if fn in keep else " "
        print(f"  {mark} {fn:<50} {size/1e6:>6.1f} MB")

    print("""
✓ Export complete!

Next steps:
  npm install
  mkdir -p public\\onnxruntime-web
  copy node_modules\\onnxruntime-web\\dist\\*.wasm public\\onnxruntime-web\\
  copy node_modules\\onnxruntime-web\\dist\\ort.min.js public\\onnxruntime-web\\
  npm run dev
""")

def _mb(path):
    return os.path.getsize(path) / 1e6

if __name__ == "__main__":
    main()
