import React, {useEffect, useState} from 'react';
import Giscus from '@giscus/react';

import styles from './styles.module.css';

const GISCUS_REPO = 'biulight/timeline';
const GISCUS_REPO_ID = 'R_kgDOH2fvlw';
const GISCUS_CATEGORY = 'Announcements';
const GISCUS_CATEGORY_ID = 'DIC_kwDOH2fvl84DD-ca';

export default function Comments(): React.JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
    };
    const observer = new MutationObserver(updateTheme);

    updateTheme();
    observer.observe(root, {attributes: true, attributeFilter: ['data-theme']});

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.comments} aria-labelledby="comments-title">
      <h2 id="comments-title">评论</h2>
      <Giscus
        key={theme}
        id="comments"
        repo={GISCUS_REPO}
        repoId={GISCUS_REPO_ID}
        category={GISCUS_CATEGORY}
        categoryId={GISCUS_CATEGORY_ID}
        mapping="pathname"
        strict="1"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang="zh-CN"
        loading="lazy"
      />
    </section>
  );
}
