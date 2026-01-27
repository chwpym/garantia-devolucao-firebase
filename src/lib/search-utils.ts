/**
 * Normalizes text for search:
 * 1. Converts to lowercase
 * 2. Removes accents (diacritics)
 * 3. Trims whitespace
 */
export const normalizeText = (text: string | number | null | undefined): string => {
    if (text === null || text === undefined) return '';
    return String(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

/**
 * Performs a smart search across multiple fields of an object.
 * Returns true if the search term is found in ANY of the specified fields.
 * 
 * @param item The object to search within
 * @param term The search term entered by the user
 * @param fields An array of keys (fields) to search against
 */
export const smartSearch = <T>(
    item: T,
    term: string,
    fields: (keyof T)[]
): boolean => {
    if (!term) return true;

    const normalizedTerm = normalizeText(term);

    // Optimization: If term is empty after normalization (e.g. just spaces), return true
    if (!normalizedTerm) return true;

    return fields.some((field) => {
        const value = item[field];
        const normalizedValue = normalizeText(value as string | number | null | undefined);
        return normalizedValue.includes(normalizedTerm);
    });
};
