export type CharacterSetOptions = {
    useAlphabet: boolean;
    useNumbers: boolean;
    useBasic: boolean;
    useExtended: boolean;
};

export type PasswordConfig = CharacterSetOptions & {
    username: string;
    site: string;
    secretPhrase?: string;
    version: number;
    length: number;
    useAnyUnicode?: boolean;
};

