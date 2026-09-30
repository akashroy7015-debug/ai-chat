# Using open-source models instead of OpenAI

Each part can be switched on its own. Change settings with the console command:
`N=NAME; V='value'; grep -q "^$N=" /etc/ai-chat.env && sed -i "s|^$N=.*|$N=$V|" /etc/ai-chat.env || echo "$N=$V" >> /etc/ai-chat.env; systemctl restart ai-chat`

## Chat

### Option A: pay-per-use host for open models (cheapest, no server)
OpenRouter, Together, DeepInfra and similar host Llama / Qwen / Mistral models.
Create an account and API key, then set:
```
LLM_PROVIDER=openai_compatible
LLM_BASE_URL=https://openrouter.ai/api/v1        # or your provider's OpenAI-compatible URL
LLM_API_KEY=your-provider-key
LLM_MODEL=meta-llama/llama-3.1-8b-instruct      # any chat model the provider lists
```
Check the provider's usage policy allows companion/romance chat.

### Option B: your own server with Ollama
Needs a GPU server (8 GB+ VRAM) for good speed. A CPU server with 16 GB RAM works but replies are slow.
On that server:
```
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:8b          # or qwen2.5:7b (good at Hindi/Hinglish)
OLLAMA_HOST=0.0.0.0 ollama serve
```
Firewall it so only your app server's IP can reach port 11434. Then on the app server set:
```
LLM_PROVIDER=openai_compatible
LLM_BASE_URL=http://GPU_SERVER_IP:11434/v1
LLM_MODEL=llama3.1:8b
```

**Safety:** keep `OPENAI_MODERATION=true` with an OpenAI key. OpenAI's moderation endpoint is free and checks every message (in any language), even when chat runs elsewhere. The built-in filters always run too.

## Character pictures: Stable Diffusion on a GPU server
Install Stable Diffusion WebUI Forge (or AUTOMATIC1111) on the GPU server and start it with the API on:
```
./webui.sh --api --listen --port 7860
```
Use a photoreal SDXL checkpoint whose licence allows commercial use. Firewall port 7860 to your app server only.
On the app server:
```
IMAGE_PROVIDER=sd
IMAGE_ENDPOINT=http://GPU_SERVER_IP:7860
SAFETY_SCANNER=remote
SAFETY_ENDPOINT=https://your-safety-service/scan
SAFETY_API_KEY=...
```
Open image models have no built-in safety, so **every picture goes through the safety scanner and is
blocked if the scanner is missing or fails** (see README "Image & video pipeline").

## Voice
Voice uses OpenAI text-to-speech. To stop OpenAI costs completely, set `VOICE_ENABLED=false`.
