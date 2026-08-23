import React, {type ReactNode} from 'react';
import DocItemFooter from '@theme-original/DocItem/Footer';
import Comments from '@site/src/components/Comments';

export default function DocItemFooterWrapper(): ReactNode {
  return (
    <>
      <DocItemFooter />
      <Comments />
    </>
  );
}
