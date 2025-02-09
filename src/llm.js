// Llm wraps interaction with an LLM

class Llm {
    constructor(apiEndpoint = null, model = null) {
        const baseEndpoint =
            apiEndpoint || window.api.OLLAMA_HOST || 'localhost:11434'
        const hasSchema = /^https?:\/\//i.test(baseEndpoint)
        const baseUrl = hasSchema ? baseEndpoint : `http://${baseEndpoint}`
        this.apiEndpoint = `${baseUrl}/api`.replace(/\/+$/, '')
        this.requestedModel = model || window.api.NOTER_OLLAMA_MODEL || 'gemma'
        this.model = this.requestedModel // Will be updated if fallback is needed
        this.isModelAvailable = false
        this.modelDetails = null
        this.availableModels = []
    }

    /**
     * Fetches list of available models from the Ollama API
     * @returns {Promise<string[]>} Array of model names
     */
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.apiEndpoint}/tags`, {
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
            this.availableModels = data.models.map((model) => model.name)
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
            const response = await fetch(`${this.apiEndpoint}/show`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model: this.model }),
            })

            if (response.ok) {
                const data = await response.json()
                this.modelDetails = data
                this.isModelAvailable = true
                return true
            }

            // If requested model is not available, try to fall back. This may
            // lead to unexpected interactions and may be too confusing.
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

    /* getModelStatus returns the name of the currenty used model and some
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
     * urlFor('generate')
     */
    urlFor(path) {
        const cleanPath = path.replace(/^\/+/, '')
        return `${this.apiEndpoint}/${cleanPath}`
    }

    /**
     * Generates text using the configured LLM
     * @param {string} prompt - The input prompt
     * @param {function} onToken - Optional callback for streaming tokens
     * @returns {Promise<string>} The generated text
     */
    async generateText(prompt, onToken = null) {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('prompt cannot be empty')
        }
        const generateRoute = this.urlFor('generate')
        try {
            const response = await fetch(generateRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                }),
            })
            if (!response.ok) {
                throw new Error(
                    `request failed with status ${response.status}: ${
                        response.statusText
                    }`
                )
            }
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
                    // Convert the Uint8Array to a string
                    const chunk = new TextDecoder().decode(value)
                    buffer += chunk

                    // Process the buffer to find complete JSON objects
                    while (true) {
                        const jsonIndex = buffer.indexOf('\n')
                        if (jsonIndex === -1) {
                            break // No complete JSON object found, wait for more data
                        }

                        const jsonString = buffer.slice(0, jsonIndex + 1)
                        buffer = buffer.slice(jsonIndex + 1)

                        try {
                            console.log(jsonString)
                            const data = JSON.parse(jsonString)
                            if (data.error) {
                                throw new Error(`LLM error: ${data.error}`)
                            }
                            // Handle the response token
                            if (data.response) {
                                if (onToken && typeof onToken === 'function') {
                                    onToken(data.response)
                                }
                                generatedText += data.response
                            }

                            if (data.done) {
                                return generatedText
                            }
                        } catch (e) {
                            console.warn('json parsing failed:', e.message)
                            throw e
                        }
                    }
                }
            } finally {
                reader.releaseLock()
            }
            return generatedText
        } catch (error) {
            console.error('llm.generateText failed with: ', error)
            throw error // Re-throw to let caller handle it
        }
    }
}

export { Llm }
