
export function subtract(v1: number[], v2: number[]): [number, number, number] {
    const [x1, y1, z1] = v1
    const [x2, y2, z2] = v2
    return [x1 - x2, y1 - y2, z1 - z2]
}

export function add(v1: number[], v2: number[]): [number, number, number] {
    const [x1, y1, z1] = v1
    const [x2, y2, z2] = v2
    return [x1 + x2, y1 + y2, z1 + z2]
}

export function multiply(v: number[], k: number): [number, number, number] {
    const [x, y, z] = v
    return [x * k, y * k, z * k]
}

export function dot(v1: number[], v2: number[]): number {
    const [x1, y1, z1] = v1
    const [x2, y2, z2] = v2
    return x1 * x2 + y1 * y2 + z1 * z2
}

export function norm(v: number[]): number {
    const [x, y, z] = v
    return Math.sqrt(x ** 2 + y ** 2 + z ** 2)
}

export function cross(v1: number[], v2: number[]): number[] {
    const [x1, y1, z1] = v1
    const [x2, y2, z2] = v2
    return [y1 * z2 - y2 * z1, x2 * z1 - x1 * z2, x1 * y2 - x2 * y1]
}

export function constrain(val: number, minDeg: number, maxDeg: number) {
    return Math.max(minDeg * Math.PI / 180, Math.min(maxDeg * Math.PI / 180, val))
}