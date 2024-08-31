export function convertKelvinToCelsius(tempKelvin: number): number {
    const tempInCelsius = tempKelvin - 273.15;
    return Math.floor(tempInCelsius); // Removes decimal part and keeps integar part
    
}