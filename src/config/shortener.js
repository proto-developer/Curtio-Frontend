import { nanoid } from "nanoid";

export const SHORTENER_DOMAIN = import.meta.env.VITE_REDIRECT_URI;

export const generateSlug = () => nanoid(7);
