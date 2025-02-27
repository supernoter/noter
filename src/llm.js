// Llm wraps interaction with an LLM using OpenAI API specification
class Llm {
    constructor(apiEndpoint = null, model = null) {
        const baseEndpoint =
            apiEndpoint || window.api.OLLAMA_HOST || 'localhost:11434'
        const hasSchema = /^https?:\/\//i.test(baseEndpoint)
        const baseUrl = hasSchema ? baseEndpoint : `http://${baseEndpoint}`
        // OpenAI API endpoint format (Ollama supports this format since
        // 02/2024: https://ollama.com/blog/openai-compatibility)
        this.apiEndpoint = `${baseUrl}`.replace(/\/+$/, '')
        this.requestedModel = model || window.api.NOTER_OLLAMA_MODEL || 'gemma'
        this.model = this.requestedModel // Will be updated if fallback is needed
        this.isModelAvailable = false
        this.modelDetails = null
        this.availableModels = []
    }

    /**
     * Fetches list of available models from the OpenAI-compatible API
     * @returns {Promise<string[]>} Array of model names
     */
    async getAvailableModels() {
        try {
            // Using OpenAI-compatible /models endpoint
            const response = await fetch(`${this.apiEndpoint}/v1/models`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(
                    `failed to fetch models: ${response.statusText}`
                )
            }

            const data = await response.json()
            // OpenAI API returns models in a different format
            this.availableModels = data.data.map((model) => model.id)
            console.log('available models: ' + this.availableModels)
            return this.availableModels
        } catch (error) {
            console.warn('failed to fetch available models:', error)
            return []
        }
    }

    /**
     * Selects a random model from available models
     * @returns {string|null} Random model name or null if none available
     */
    selectRandomModel() {
        if (this.availableModels.length === 0) return null
        const randomIndex = Math.floor(
            Math.random() * this.availableModels.length
        )
        return this.availableModels[randomIndex]
    }

    /* checkModelAvailability returns Promise[bool], indicating whether a
     * requested model is ready to use. */
    async checkModelAvailability() {
        try {
            // Using OpenAI-compatible endpoint to check model availability
            const response = await fetch(
                `${this.apiEndpoint}/v1/models/${this.model}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (response.ok) {
                const data = await response.json()
                this.modelDetails = data
                this.isModelAvailable = true
                return true
            }

            // If requested model is not available, try to fall back
            await this.getAvailableModels()
            if (this.availableModels.length > 0) {
                const fallbackModel = this.selectRandomModel()
                if (fallbackModel) {
                    console.warn(
                        `model ${this.model} not available, falling back to ${fallbackModel}`
                    )
                    this.model = fallbackModel
                    return this.checkModelAvailability() // recursively check the fallback model
                }
            }
            // No model or fallback available at all.
            this.modelDetails = null
            this.isModelAvailable = false
            return false
        } catch (error) {
            console.warn('model availability check failed:', error)
            this.modelDetails = null
            this.isModelAvailable = false
            return false
        }
    }

    /* getModelStatus returns the name of the currently used model and some
     * extra. TODO: remove the fields we do not actually need. */
    getModelStatus() {
        if (!this.isModelAvailable) return null
        return {
            currentModel: this.model,
            requestedModel: this.requestedModel,
            isFallback: this.model !== this.requestedModel,
        }
    }

    /**
     * urlFor(path) returns a clean subpath for the endpoint, e.g.
     * urlFor('completions')
     */
    urlFor(path) {
        const cleanPath = path.replace(/^\/+/, '')
        return `${this.apiEndpoint}/v1/${cleanPath}`
    }

    /**
     * Generates text using the configured LLM through OpenAI-compatible API
     * @param {string} prompt - The input prompt
     * @param {function} onToken - Optional callback for streaming tokens
     * @returns {Promise<string>} The generated text
     */
    async generateText(prompt, onToken = null) {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('prompt cannot be empty')
        }

        // Using stream parameter for token-by-token responses
        const shouldStream = onToken && typeof onToken === 'function'

        // Using OpenAI chat completions endpoint
        const completionsUrl = this.urlFor('chat/completions')

        try {
            const requestBody = {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                stream: shouldStream,
            }

            const response = await fetch(completionsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                throw new Error(
                    `request failed with status ${response.status}: ${response.statusText}`
                )
            }

            // Handle streaming response
            if (shouldStream) {
                if (!response.body) {
                    throw new Error('response body is null')
                }

                const reader = response.body.getReader()
                let generatedText = ''
                let buffer = ''

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) {
                            break
                        }

                        // Convert the Uint8Array to a string (using Node-friendly method)
                        const chunk =
                            typeof TextDecoder !== 'undefined'
                                ? new TextDecoder().decode(value)
                                : Buffer.from(value).toString('utf-8')
                        buffer += chunk

                        // Split by "data: " delimiter for SSE format
                        const lines = buffer.split('\n')
                        buffer = lines.pop() || '' // Keep the last potentially incomplete line

                        for (const line of lines) {
                            if (!line.trim() || line.includes('[DONE]'))
                                continue

                            // Remove "data: " prefix from each line
                            const jsonLine = line.replace(/^data: /, '').trim()
                            if (!jsonLine) continue

                            try {
                                const data = JSON.parse(jsonLine)
                                // Extract content from the delta in streaming response
                                const content =
                                    data.choices?.[0]?.delta?.content

                                if (content) {
                                    if (onToken) {
                                        onToken(content)
                                    }
                                    generatedText += content
                                }
                            } catch (e) {
                                console.warn(
                                    'json parsing failed:',
                                    e.message,
                                    jsonLine
                                )
                                // Continue processing other lines
                            }
                        }
                    }
                } finally {
                    reader.releaseLock()
                }

                return generatedText
            } else {
                // Handle non-streaming response
                const data = await response.json()
                const generatedText = data.choices?.[0]?.message?.content || ''
                return generatedText
            }
        } catch (error) {
            console.error('llm.generateText failed with: ', error)
            throw error // Re-throw to let caller handle it
        }
    }
}

export { Llm }
