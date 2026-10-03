ONNX Model Files — Not included in this zip (too large)
=======================================================

Run the export script to generate these files:

  cd src/data-pipeline
  pip install transformers "optimum[exporters]" onnx onnxruntime torch
  python export_trocr_onnx.py

This will create:
  encoder_model_int8.onnx  (~40 MB)
  decoder_model_int8.onnx  (~45 MB)
  processor_config.json

The app works WITHOUT these files using manual text input.
OCR is only needed for camera/photo scanning.
