import { createContext, useContext } from "react";

export const SavedListingsContext = createContext(null);

export function useSavedListings() {
  const context = useContext(SavedListingsContext);
  if (!context)
    throw new Error(
      "useSavedListings must be used within a SavedListingsProvider",
    );
  return context;
}
