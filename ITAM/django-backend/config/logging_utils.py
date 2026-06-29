"""Logging utilities for the project."""

import logging
import logging.config
import os
from pathlib import Path

from pythonjsonlogger import jsonlogger


def setup_logging(
    log_level: str = "INFO",
    log_file: str = "logs/django.log",
) -> None:
    """
    Configure logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file
    """
    # Create logs directory
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    # Configure logging
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": "[{levelname}] {asctime} {name} {process:d} {thread:d} - {message}",
                "style": "{",
            },
            "json": {
                "()": jsonlogger.JsonFormatter,
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "verbose",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": log_level,
                "filename": log_file,
                "maxBytes": 1024 * 1024 * 5,  # 5MB
                "backupCount": 5,
                "formatter": "json",
            },
        },
        "root": {
            "handlers": ["console", "file"],
            "level": log_level,
        },
        "loggers": {
            "django": {
                "handlers": ["console", "file"],
                "level": log_level,
                "propagate": False,
            },
        },
    }

    logging.config.dictConfig(logging_config)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class RequestLoggingMiddleware:
    """Middleware to log HTTP requests and responses."""

    def __init__(self, get_response):
        """Initialize middleware."""
        self.get_response = get_response
        self.logger = get_logger(__name__)

    def __call__(self, request):
        """Process request and response."""
        # Log request
        self.logger.info(
            f"Request: {request.method} {request.path}",
            extra={
                "method": request.method,
                "path": request.path,
                "remote_addr": request.META.get("REMOTE_ADDR"),
                "user": request.user.username if request.user.is_authenticated else "anonymous",
            },
        )

        # Get response
        response = self.get_response(request)

        # Log response
        self.logger.info(
            f"Response: {response.status_code}",
            extra={
                "status_code": response.status_code,
                "path": request.path,
            },
        )

        return response


class ErrorLoggingMixin:
    """Mixin to add error logging to views."""

    def handle_exception(self, exc):
        """Log exceptions."""
        logger = get_logger(self.__class__.__module__)
        logger.exception(
            f"Exception in {self.__class__.__name__}",
            extra={
                "view": self.__class__.__name__,
                "exception": str(exc),
            },
        )
        raise
