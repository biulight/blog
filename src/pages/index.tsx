import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/products">
            浏览产品手册
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/products/shine">
            开始使用 Shine
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="产品手册与知识库"
      description="Biulight 产品手册、实践指南与持续沉淀的知识。">
      <HomepageHeader />
      <main className={styles.main}>
        <section className="container">
          <div className="row">
            <div className="col col--6">
              <div className={styles.card}>
                <h2>产品手册</h2>
                <p>按任务查找安装、配置、操作和故障排查说明。</p>
                <Link to="/products">查看全部产品 →</Link>
              </div>
            </div>
            <div className="col col--6">
              <div className={styles.card}>
                <h2>知识库</h2>
                <p>沉淀跨项目可复用、经过验证的实践知识。</p>
                <Link to="/knowledge">进入知识库 →</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
