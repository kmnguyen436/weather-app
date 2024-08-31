export function metersToKilometers(visibilityIneters: number):string {
    const visibilityInKilometers = visibilityIneters / 1000;
    return `${visibilityInKilometers.toFixed(0)}km`;
}