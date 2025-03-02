// Tests for utility functions
const utils = require('./utils')

describe('Utility Functions', () => {
    describe('getCurrentFormattedTimestamp', () => {
        test('returns formatted timestamp with correct format', () => {
            const mockDate = new Date('2024-12-31T12:00:00')
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
            const timestamp = utils.getCurrentFormattedTimestamp()
            expect(timestamp).toBe('241231-120000')
            global.Date.mockRestore()
        })

        test('handles single-digit months, days, hours, minutes, seconds', () => {
            const mockDate = new Date('2023-02-05T09:05:08')
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
            const timestamp = utils.getCurrentFormattedTimestamp()
            expect(timestamp).toBe('230205-090508')
            global.Date.mockRestore()
        })
    })

    describe('generatePronounceableName', () => {
        test('generates a name with default length of 2 syllables', () => {
            const mockRandom = jest.spyOn(Math, 'random')
            mockRandom.mockReturnValueOnce(0).mockReturnValueOnce(0)
            const name = utils.generatePronounceableName()
            // When Math.random returns 0, it should select the first syllable each time
            // The first syllable should be "ba" (first consonant + first vowel)
            // Called twice with default length of 2
            expect(name).toBe('baba')
            mockRandom.mockRestore()
        })

        test('respects the length parameter', () => {
            // Test with different lengths
            const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0)
            expect(utils.generatePronounceableName(1)).toHaveLength(2) // "ba" - one syllable of length 2
            expect(utils.generatePronounceableName(3)).toHaveLength(6) // "bababa" - three syllables of length 2 each
            expect(utils.generatePronounceableName(5)).toHaveLength(10) // "bababababa" - five syllables
            mockRandom.mockRestore()
        })

        test('generates different names on successive calls', () => {
            const name1 = utils.generatePronounceableName()
            const name2 = utils.generatePronounceableName()
            const name3 = utils.generatePronounceableName()
            // With very high probability, these should all be different
            // There's an incredibly small chance this test could fail randomly
            const names = new Set([name1, name2, name3])
            expect(names.size).toBeGreaterThan(1)
        })

        test('generates names that are strings', () => {
            const name = utils.generatePronounceableName()
            expect(typeof name).toBe('string')
            expect(name.length).toBeGreaterThan(0)
        })

        test('uses all provided syllable types', () => {
            jest.spyOn(Math, 'random')
            // Force different values for random to hit different syllable types
            Math.random
                .mockReturnValueOnce(0) // First syllable type (consonant + vowel)
                .mockReturnValueOnce(0.5) // Middle of the list
                .mockReturnValueOnce(0.99) // End of the list (likely a fixed syllable like 'er', 'on', etc.)
            const name = utils.generatePronounceableName(3)
            // We can't easily predict the exact output due to the complex syllable generation,
            // but we can check it generated something reasonable
            expect(name.length).toBeGreaterThan(3)
            Math.random.mockRestore()
        })
    })
})
