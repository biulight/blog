import React, {type ReactNode} from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemFooter from '@theme-original/BlogPostItem/Footer';
import Comments from '@site/src/components/Comments';

export default function BlogPostItemFooterWrapper(): ReactNode {
  const {isBlogPostPage} = useBlogPost();

  return (
    <>
      <BlogPostItemFooter />
      {isBlogPostPage && <Comments />}
    </>
  );
}
