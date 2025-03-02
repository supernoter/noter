// getCurrentFormattedTimestamp returns a preformatted timestamp
const getCurrentFormattedTimestamp = () => {
    const now = new Date()
    return (
        now.getFullYear().toString().slice(-2) +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        '-' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0')
    )
}

// generatePronounceableName returns a pronounceable string, for random
// filenames.
function generatePronounceableName(length = 2) {
    const consonants = [
        'b',
        'c',
        'd',
        'f',
        'g',
        'h',
        'j',
        'k',
        'l',
        'm',
        'n',
        'p',
        'r',
        's',
        't',
        'v',
        'w',
        'z',
    ]
    const vowels = ['a', 'e', 'i', 'o', 'u']

    const syllables = [
        ...consonants.flatMap((c) => vowels.map((v) => c + v)),
        ...consonants.flatMap((c1) =>
            vowels.flatMap((v) => consonants.map((c2) => c1 + v + c2))
        ),
        'er',
        'on',
        'in',
        'an',
        'en',
        'el',
        'ar',
        'or',
        'us',
        'um',
        'ix',
        'ex',
    ]

    let name = ''
    for (let i = 0; i < length; i++) {
        const randomSyllable =
            syllables[Math.floor(Math.random() * syllables.length)]
        name += randomSyllable
    }
    return name
}

module.exports = {
    getCurrentFormattedTimestamp,
    generatePronounceableName,
}
