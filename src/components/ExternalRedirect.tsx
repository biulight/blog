import React, {useEffect} from 'react';
import Head from '@docusaurus/Head';

type Props = {
  to: string;
};

export default function ExternalRedirect({to}: Props): React.JSX.Element {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <>
      <Head>
        <meta httpEquiv="refresh" content={`0;url=${to}`} />
        <link rel="canonical" href={to} />
      </Head>
      <p>
        Shine 手册已迁移到产品仓库。若页面没有自动跳转，请
        <a href={to}>打开新页面</a>。
      </p>
    </>
  );
}
