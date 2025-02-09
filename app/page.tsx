import FileUpload from '@/components/file-upload'
import SubjectsFiles from '@/components/SubjectFiles'
import React from 'react'

const page = () => {
  return (
    <div>
      <FileUpload/>
      <SubjectsFiles fileType="pdf" />
    </div>
  )
}

export default page