"""HTTP client for interacting with the AI Help Center service.

This module powers the :mod:`aichat` Python package.  It mirrors the behaviour of the
TypeScript SDK that ships with the Next.js application so Python developers can trigger
chat completions and upload datasets without manually crafting HTTP requests.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, Mapping, Optional, Sequence, Union
import requests


class AiChatError(RuntimeError):
    """Base exception raised for client level failures."""


@dataclass
class RetrievedDoc:
    """Representation of a document that can be sent to the retrieval pipeline."""

    id: str
    title: str
    url: str
    text: str
    created_at: Optional[str] = None
    extras: Mapping[str, Any] = field(default_factory=dict)

    def to_payload(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "text": self.text,
        }
        if self.created_at is not None:
            payload["created_at"] = self.created_at
        payload.update(dict(self.extras))
        return payload


@dataclass
class DatasetDocumentInput:
    """Document accepted by the dataset upload endpoint.

    The identifier is optional because the API can generate one automatically when it is
    omitted.
    """

    title: str
    text: str
    url: str
    id: Optional[str] = None
    created_at: Optional[str] = None
    extras: Mapping[str, Any] = field(default_factory=dict)

    def to_payload(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "title": self.title,
            "text": self.text,
            "url": self.url,
        }
        if self.id is not None:
            payload["id"] = self.id
        if self.created_at is not None:
            payload["created_at"] = self.created_at
        payload.update(dict(self.extras))
        return payload


@dataclass
class AskOptions:
    """Optional parameters that can accompany an :class:`AiChatClient` ask request."""

    workspace: Optional[Mapping[str, Any]] = None
    retrieved_docs: Optional[Sequence[Union[RetrievedDoc, Mapping[str, Any]]]] = None
    policies: Optional[Mapping[str, Any]] = None
    mode: Optional[str] = None
    extras: Mapping[str, Any] = field(default_factory=dict)

    def to_payload(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {}
        if self.workspace is not None:
            payload["workspace"] = dict(self.workspace)
        if self.retrieved_docs is not None:
            payload["retrieved_docs"] = [
                _normalize_document(doc) for doc in self.retrieved_docs
            ]
        if self.policies is not None:
            payload["policies"] = dict(self.policies)
        if self.mode is not None:
            payload["mode"] = self.mode
        payload.update(dict(self.extras))
        return payload


@dataclass
class DatasetUploadOptions:
    """Customisation flags accepted by :meth:`AiChatClient.upload_dataset`."""

    mode: str = "append"
    extras: Mapping[str, Any] = field(default_factory=dict)

    def to_payload(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"mode": self.mode}
        payload.update(dict(self.extras))
        return payload


class AiChatClient:
    """High level HTTP client for the AI Help Center API."""

    def __init__(
        self,
        base_url: str,
        *,
        ask_path: str = "/api/ask",
        dataset_path: str = "/api/datasets",
        session: Optional[requests.Session] = None,
        default_headers: Optional[Mapping[str, str]] = None,
        timeout: Optional[float] = 30.0,
    ) -> None:
        if not base_url or not base_url.strip():
            raise ValueError("base_url is required to initialize AiChatClient.")

        self._base_url = base_url.rstrip("/")
        self._ask_path = ask_path
        self._dataset_path = dataset_path
        self._session = session or requests.Session()
        self._default_headers = dict(default_headers or {})
        self._timeout = timeout

    @property
    def base_url(self) -> str:
        return self._base_url

    def ask(
        self,
        question: str,
        options: Optional[Union[AskOptions, Mapping[str, Any]]] = None,
    ) -> Dict[str, Any]:
        if not question or not question.strip():
            raise ValueError("question must be a non-empty string.")

        payload: Dict[str, Any] = {"question": question}
        if options is not None:
            payload.update(_normalize_ask_options(options))

        return self._post_json(self._ask_path, payload, "Failed to submit ask request")

    def upload_dataset(
        self,
        documents: Sequence[Union[DatasetDocumentInput, Mapping[str, Any]]],
        options: Optional[Union[DatasetUploadOptions, Mapping[str, Any]]] = None,
    ) -> Dict[str, Any]:
        if not isinstance(documents, Sequence) or len(documents) == 0:
            raise ValueError("At least one document is required when uploading a dataset.")

        normalized_docs = [_normalize_dataset_document(doc) for doc in documents]

        payload: Dict[str, Any] = {"documents": normalized_docs}
        if options is None:
            payload["mode"] = "append"
        else:
            normalized_options = _normalize_dataset_options(options)
            payload.update(normalized_options)
            if "mode" not in payload:
                payload["mode"] = "append"

        return self._post_json(
            self._dataset_path,
            payload,
            "Failed to upload dataset",
        )

    def close(self) -> None:
        self._session.close()

    def __enter__(self) -> "AiChatClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    # Internal helpers -------------------------------------------------
    def _post_json(self, path: str, body: Mapping[str, Any], error_context: str) -> Dict[str, Any]:
        url = self._build_url(path)
        headers = {"Content-Type": "application/json", **self._default_headers}

        try:
            response = self._session.post(
                url,
                json=body,
                headers=headers,
                timeout=self._timeout,
            )
        except requests.RequestException as exc:
            raise AiChatError(f"{error_context}: {exc}") from exc

        if not response.ok:
            detail = response.text.strip() or response.reason
            raise AiChatError(
                f"{error_context} (status {response.status_code}): {detail}"
            )

        try:
            return response.json()
        except ValueError as exc:  # pragma: no cover - upstream always returns JSON
            raise AiChatError("Response did not contain valid JSON") from exc

    def _build_url(self, path: str) -> str:
        if path.startswith("http://") or path.startswith("https://"):
            return path
        if not path.startswith("/"):
            return f"{self._base_url}/{path}"
        return f"{self._base_url}{path}"


def _normalize_document(
    document: Union[RetrievedDoc, Mapping[str, Any]],
) -> Dict[str, Any]:
    if isinstance(document, RetrievedDoc):
        return document.to_payload()
    if isinstance(document, Mapping):
        return dict(document)
    raise TypeError("retrieved_docs must contain mappings or RetrievedDoc instances")


def _normalize_dataset_document(
    document: Union[DatasetDocumentInput, Mapping[str, Any]],
) -> Dict[str, Any]:
    if isinstance(document, DatasetDocumentInput):
        return document.to_payload()
    if isinstance(document, Mapping):
        return dict(document)
    raise TypeError("documents must contain mappings or DatasetDocumentInput instances")


def _normalize_ask_options(options: Union[AskOptions, Mapping[str, Any]]) -> Dict[str, Any]:
    if isinstance(options, AskOptions):
        return options.to_payload()
    if isinstance(options, Mapping):
        normalized: Dict[str, Any] = dict(options)
        if "retrieved_docs" in normalized:
            retrieved_docs = normalized["retrieved_docs"]
            if not isinstance(retrieved_docs, Iterable):
                raise TypeError("retrieved_docs must be an iterable")
            normalized["retrieved_docs"] = [
                _normalize_document(doc) for doc in retrieved_docs
            ]
        if "workspace" in normalized and not isinstance(normalized["workspace"], Mapping):
            raise TypeError("workspace must be a mapping if provided")
        if "policies" in normalized and not isinstance(normalized["policies"], Mapping):
            raise TypeError("policies must be a mapping if provided")
        return normalized
    raise TypeError("options must be a mapping or AskOptions instance")


def _normalize_dataset_options(
    options: Union[DatasetUploadOptions, Mapping[str, Any]]
) -> Dict[str, Any]:
    if isinstance(options, DatasetUploadOptions):
        return options.to_payload()
    if isinstance(options, Mapping):
        return dict(options)
    raise TypeError("options must be a mapping or DatasetUploadOptions instance")
