export const passwordRules = [
  { id: "length", label: "Entre 8 e 256 caracteres", test: (value: string) => value.length >= 8 && value.length <= 256 },
  { id: "uppercase", label: "Uma letra maiúscula", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "Uma letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { id: "number", label: "Um número", test: (value: string) => /[0-9]/.test(value) },
  { id: "symbol", label: "Um símbolo (ex.: !, @, #)", test: (value: string) => /[\^$*.[\]{}()?!"@#%&/\\,><':;|_~`=+\-]/.test(value) },
  { id: "whitespace", label: "Sem espaços", test: (value: string) => value.length > 0 && !/\s/.test(value) },
];

export function passwordMeetsPolicy(value: string) {
  return passwordRules.every((rule) => rule.test(value));
}
