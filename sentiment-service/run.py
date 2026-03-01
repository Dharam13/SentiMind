#!/usr/bin/env python3
"""Run the sentiment analysis service with uvicorn."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8030,
        reload=False,
        log_level="info",
    )
