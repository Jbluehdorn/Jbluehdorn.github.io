const LoadImageSrc = (dir: string, file: string): string => {
    let value = document.getElementById(dir)
        ?.getElementsByTagName('img').namedItem(file)!.src
    
    return value!
}

export default LoadImageSrc