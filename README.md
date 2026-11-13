# Eya Zantour — Portfolio

Personal portfolio of Eya Zantour, AI engineer at Smoft ERP (Sousse, Tunisia).

**Live site:** https://ayazantour.github.io/Portfolio/

## What's inside

The site is built around case studies of my work on **IASMO**, the multi-agent AI system integrated into Smoft ERP:

- **SmartOCR**: the document classification and extraction agent I designed for my final-year project (PaddleOCR, Qwen3-14B, Qdrant, BGE-M3). It reached 95% classification and 91% field-extraction accuracy.
- **The Supervisor**: LangGraph-based routing between agents, with retrieval used to keep prompt size under control.
- **Model serving**: vLLM inference services on multi-GPU Linux servers (NVIDIA L4), run as systemd units.

It also covers other projects (RAG, ALPR, MLOps, microservices), experience, education and certifications.

## Tech

Plain HTML, CSS and JavaScript, with no framework and no build step.

- Light and dark themes
- Interactive demos: a SmartOCR pipeline replay and a Supervisor routing example, both using illustrative data
- Respects `prefers-reduced-motion`
- Contact form delivered through [FormSubmit](https://formsubmit.co)

## Run locally

Open `index.html` in a browser. To test the contact form, serve the folder over HTTP instead:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Contact

- Email: aya.zantour@polytechnicien.tn
- LinkedIn: [linkedin.com/in/eya-zantour](https://www.linkedin.com/in/eya-zantour)
- GitHub: [github.com/AyaZantour](https://github.com/AyaZantour)
