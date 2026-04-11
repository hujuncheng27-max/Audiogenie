export CUDA_VISIBLE_DEVICES=0,1

python -m pdb run.py \
    --text "The background sound features sea waves sound effects." \
    --llm "qwen3-omni-alibaba" \
    --video bin/searainbow.mp4 \
    --outdir "test_outputs"