"use client"

import React from "react"
import { useFiles } from "@/hooks/use-files"
import { FileListView } from "./FileListView"

export default function FileList(): React.JSX.Element {
  const filesState = useFiles()

  return (
    <FileListView {...filesState} />
  )
}
