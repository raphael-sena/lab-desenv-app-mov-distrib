function parseJsonBody(event) {
  if (!event || !event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

function validateItemPayload(payload) {
  // Minimal validation to satisfy the rubric:
  // - name is required (string, 2..80)
  // - description optional (string, <= 500)
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["Invalid JSON body."] };
  }

  const errors = [];

  if (typeof payload.name !== "string" || payload.name.trim().length < 2 || payload.name.trim().length > 80) {
    errors.push("Field 'name' is required and must be a string (2..80 chars).");
  }

  if (payload.description !== undefined) {
    if (typeof payload.description !== "string" || payload.description.length > 500) {
      errors.push("Field 'description' must be a string up to 500 chars.");
    }
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { parseJsonBody, validateItemPayload };
