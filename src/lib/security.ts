// Input sanitization utilities

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>'"&]/g, (char) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
      "&": "&amp;",
    };
    return map[char] || char;
  });
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^[+]?[\d\s-]{10,15}$/.test(phone);
};
