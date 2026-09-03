# Build stage with uv
FROM ghcr.io/astral-sh/uv:latest AS uv_bin
FROM python:3.10-slim

WORKDIR /app

# Copy uv binary from official uv image
COPY --from=uv_bin /uv /uvx /bin/

# Set uv environment variables for optimization
ENV UV_SYSTEM_PYTHON=1
ENV UV_COMPILE_BYTECODE=1

COPY requirements.txt .

# Install CPU PyTorch and dependencies with uv
RUN uv pip install --no-cache torch --index-url https://download.pytorch.org/whl/cpu && \
    uv pip install --no-cache -r requirements.txt

COPY . .

EXPOSE 8030

CMD ["uv", "run", "python", "run.py"]