import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function getErrorMessage(error, fallback) {
  const data = error.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];

    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }

  return fallback;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString();
}

export default function CommentsSection({ productId, ownerId }) {
  const { user, loading: authLoading } = useAuth();

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const userId = user?.id ?? user?.pk;
  const isOwnProduct =
    userId != null && ownerId != null && String(userId) === String(ownerId);

  const loadComments = useCallback(
    async (signal) => {
      setCommentsLoading(true);
      setError("");

      try {
        const response = await api.get(`/api/products/${productId}/comments/`, {
          signal,
        });

        const data = response.data;
        const results = Array.isArray(data) ? data : data?.results;

        setComments(Array.isArray(results) ? results : []);
      } catch (err) {
        if (err.code !== "ERR_CANCELED") {
          setError(
            getErrorMessage(err, "Unable to load comments. Please try again."),
          );
        }
      } finally {
        if (!signal?.aborted) {
          setCommentsLoading(false);
        }
      }
    },
    [productId],
  );

  useEffect(() => {
    const controller = new AbortController();

    loadComments(controller.signal);

    return () => controller.abort();
  }, [loadComments]);

  async function handleAddComment(event) {
    event.preventDefault();

    const body = newComment.trim();

    if (!body || submitting) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(`/api/products/${productId}/comments/`, {
        body,
      });

      setComments((current) => [
        response.data,
        ...current.filter((comment) => comment.id !== response.data.id),
      ]);

      setNewComment("");
      setMessage("Your comment was added.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to add your comment. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(comment) {
    setEditingId(comment.id);
    setEditBody(comment.body);
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditBody("");
  }

  async function handleSaveEdit(event, commentId) {
    event.preventDefault();

    const body = editBody.trim();

    if (!body || savingEdit) return;

    setSavingEdit(true);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(`/api/comments/${commentId}/`, {
        body,
      });

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId ? response.data : comment,
        ),
      );

      cancelEditing();
      setMessage("Your comment was updated.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to update the comment. Please try again."),
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteComment(commentId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed || deletingId !== null) return;

    setDeletingId(commentId);
    setError("");
    setMessage("");

    try {
      await api.delete(`/api/comments/${commentId}/`);

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );

      if (editingId === commentId) {
        cancelEditing();
      }

      setMessage("Your comment was deleted.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to delete the comment. Please try again."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="comments-section mt-5 pt-4 border-top">
      <h2 className="h3 mb-4">Customer Comments</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      {authLoading ? (
        <p className="text-muted">Checking your account...</p>
      ) : user && isOwnProduct ? (
        <div className="alert alert-info">
          You cannot comment on your own product.
        </div>
      ) : user ? (
        <form onSubmit={handleAddComment} className="mb-4">
          <label htmlFor="new-comment" className="form-label fw-semibold">
            Write a comment
          </label>

          <textarea
            id="new-comment"
            className="form-control"
            rows="3"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Share your thoughts about this product..."
            maxLength={5000}
            required
            disabled={submitting}
          />

          <button
            type="submit"
            className="btn btn-primary mt-2"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p className="mb-4">
          <Link to="/login">Log in</Link> to leave a comment.
        </p>
      )}

      {commentsLoading ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading comments...</span>
          </div>
          <p className="text-muted mt-2">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {comments.map((comment) => {
            const isAuthor =
              userId != null &&
              comment.author_id != null &&
              String(userId) === String(comment.author_id);

            return (
              <article key={comment.id} className="card comment-card">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                    <strong>{comment.author || "Unknown user"}</strong>

                    <small className="text-muted">
                      {formatDate(comment.updated_at || comment.created_at)}
                      {comment.updated_at &&
                        comment.created_at &&
                        comment.updated_at !== comment.created_at &&
                        " (edited)"}
                    </small>
                  </div>

                  {editingId === comment.id ? (
                    <form
                      onSubmit={(event) => handleSaveEdit(event, comment.id)}
                    >
                      <textarea
                        className="form-control"
                        rows="3"
                        value={editBody}
                        onChange={(event) => setEditBody(event.target.value)}
                        maxLength={5000}
                        required
                        disabled={savingEdit}
                        aria-label="Edit comment"
                      />

                      <div className="d-flex gap-2 mt-2">
                        <button
                          type="submit"
                          className="btn btn-sm btn-primary"
                          disabled={savingEdit || !editBody.trim()}
                        >
                          {savingEdit ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={cancelEditing}
                          disabled={savingEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mb-0 comment-body">{comment.body}</p>
                  )}

                  {isAuthor && editingId !== comment.id && (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => startEditing(comment)}
                        disabled={deletingId !== null}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === comment.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
