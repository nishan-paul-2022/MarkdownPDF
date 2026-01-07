"use client"

import React from "react"
import { useUpload } from "@/hooks/use-upload"
import { FileUploadView } from "./FileUploadView"

export default function FileUpload(): React.JSX.Element {
  const uploadState = useUpload()

  return (
    <FileUploadView {...uploadState} />
  )
}
