import React, { ReactElement } from "react"

type ContentTypeProps = {
    content: ReactElement
}


export const ContentItem = ({content}:ContentTypeProps) => {
    return (
        <div className="secondaryColor contentItem">
        {content}
        </div>
    )
}