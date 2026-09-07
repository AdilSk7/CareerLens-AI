import os
from dotenv import load_dotenv
load_dotenv()
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
resp = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[{"role": "user", "content": 'Reply with JSON: {"status":"ok"}'}],
    response_format={"type": "json_object"},
    temperature=0.2
)
print("Model test OK:", resp.choices[0].message.content)
