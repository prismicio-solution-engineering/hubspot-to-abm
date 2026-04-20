"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ListSearchBar from "./ListSearchBar";
import UrlInput from "./UrlInput";

export default function ListSearch() {
  const router = useRouter();
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [urlResetKey, setUrlResetKey] = useState(0);

  function goToList(id: string) {
    router.replace(`/?listId=${encodeURIComponent(id)}`);
  }

  function selectFromSearch(id: string) {
    setUrlResetKey((k) => k + 1);
    goToList(id);
  }

  function selectFromUrl(id: string) {
    setSearchResetKey((k) => k + 1);
    goToList(id);
  }

  return (
    <div className="flex flex-col gap-4">
      <ListSearchBar key={`search-${searchResetKey}`} onListSelected={selectFromSearch} />
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
        <span className="h-px flex-1 bg-gray-200" aria-hidden />
        <span>ou</span>
        <span className="h-px flex-1 bg-gray-200" aria-hidden />
      </div>
      <UrlInput key={`url-${urlResetKey}`} onListSelected={selectFromUrl} />
    </div>
  );
}
