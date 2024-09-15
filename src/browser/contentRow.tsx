
import { Stack } from "@mui/material"
import React, { ReactElement } from "react"
import { ContentItem } from "./contentItem"

type contentRowProps = {
    content1: ReactElement
}

export const ContentRow = ({content1}:contentRowProps) => {
    console.log(content1)
    return(
        <div className='contentRow'>
        <Stack direction="row" spacing={3} className="">
            <ContentItem content={content1}/>
            <ContentItem content={(<></>)}/>
        </Stack>
        </div>
        )
}