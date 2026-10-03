ONNX Runtime WASM Files — Not included in this zip
===================================================

After running `npm install`, copy these:

  cp node_modules/onnxruntime-web/dist/*.wasm public/onnxruntime-web/
  cp node_modules/onnxruntime-web/dist/ort.min.js public/onnxruntime-web/

Or let Vite's dev server handle it automatically via CDN.
