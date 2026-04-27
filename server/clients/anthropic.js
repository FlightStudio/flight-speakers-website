// Single shared Anthropic SDK client.
// Lazy-init so tests can swap in a mock before the first call, and so the
// process doesn't bail at import time when ANTHROPIC_API_KEY is unset (we
// want callers to handle that case gracefully — see parseBrief).
import Anthropic from '@anthropic-ai/sdk'

let _client = null

export function getAnthropic() {
  if (!_client) _client = new Anthropic()
  return _client
}

// Test seam — pass a mock client; pass null to reset to the real SDK.
export function setAnthropicForTests(client) {
  _client = client
}
