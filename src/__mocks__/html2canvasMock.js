const html2canvas = jest.fn().mockImplementation(() => {
    return Promise.resolve({
        width: 800,
        height: 600,
        toDataURL: jest
            .fn()
            .mockReturnValue('data:image/png;base64,mockBase64Data'),
    })
})

export default html2canvas
