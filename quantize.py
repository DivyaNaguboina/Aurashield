from onnxruntime.quantization import quantize_dynamic, QuantType
import os

base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'models', 'trocr_onnx')

enc_fp32 = os.path.join(base, 'encoder_model.onnx')
enc_int8 = os.path.join(base, 'encoder_model_int8.onnx')
dec_fp32 = os.path.join(base, 'decoder_model.onnx')
dec_int8 = os.path.join(base, 'decoder_model_int8.onnx')

print("Quantising encoder...")
quantize_dynamic(enc_fp32, enc_int8, weight_type=QuantType.QInt8)
print(f"  encoder done: {os.path.getsize(enc_int8)/1e6:.1f} MB")

print("Quantising decoder...")
quantize_dynamic(dec_fp32, dec_int8, weight_type=QuantType.QInt8)
print(f"  decoder done: {os.path.getsize(dec_int8)/1e6:.1f} MB")

print("\nNow saving tokenizer vocab...")
from transformers import TrOCRProcessor
import json

processor = TrOCRProcessor.from_pretrained("microsoft/trocr-small-printed")
processor.tokenizer.save_pretrained(base)

vocab = processor.tokenizer.get_vocab()
id2tok = {str(v): k for k, v in vocab.items()}
with open(os.path.join(base, "id2token.json"), "w", encoding="utf-8") as f:
    json.dump(id2tok, f, ensure_ascii=False)

special = {
    "bos_token_id": processor.tokenizer.bos_token_id,
    "eos_token_id": processor.tokenizer.eos_token_id,
    "pad_token_id": processor.tokenizer.pad_token_id,
    "vocab_size":   processor.tokenizer.vocab_size,
}
with open(os.path.join(base, "special_tokens.json"), "w") as f:
    json.dump(special, f, indent=2)

ip = processor.image_processor
cfg = {
    "image_mean": list(ip.image_mean),
    "image_std":  list(ip.image_std),
    "size": {"height": 384, "width": 384},
}
with open(os.path.join(base, "processor_config.json"), "w") as f:
    json.dump(cfg, f, indent=2)

print("\n✓ All done! Files in:", base)
for fn in sorted(os.listdir(base)):
    size = os.path.getsize(os.path.join(base, fn))
    print(f"  {fn:<50} {size/1e6:>6.1f} MB")

print("""
Next steps:
  npm install
  mkdir -p public/onnxruntime-web
  cp node_modules/onnxruntime-web/dist/*.wasm public/onnxruntime-web/
  cp node_modules/onnxruntime-web/dist/ort.min.js public/onnxruntime-web/
  npm run dev
""")
