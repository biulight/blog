// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Biulight 文档',
  tagline: '产品手册、实践指南与持续沉淀的知识',
  url: 'https://blog.biulight.cn',
  baseUrl: '/timeline/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'facebook', // Usually your GitHub org/user name.
  // projectName: 'docusaurus', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          path: 'blog',
          routeBasePath: 'blog',
          showReadingTime: true,
          blogSidebarTitle: 'All our posts',
          blogSidebarCount: 'ALL',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} Biulight`,
            createFeedItems: async (params) => {
              const { blogPosts, defaultCreateFeedItems, ...rest } = params;
              return defaultCreateFeedItems({
                // keep only the 10 most recent blog posts in the feed
                blogPosts: blogPosts.filter((item, index) => index < 10),
                ...rest,
              });
            },
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-9T8R2R2Y3V',
          anonymizeIP: true, // Should IPs be anonymized?
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Biulight 文档',
        logo: {
          alt: 'biulight Site Logo',
          src: 'img/logo1.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'products',
            position: 'left',
            label: '产品手册',
          },
          {
            type: 'docSidebar',
            sidebarId: 'knowledge',
            position: 'left',
            label: '知识库',
          },
          {
            type: 'docSidebar',
            sidebarId: 'frontend',
            position: 'left',
            label: '前端',
          },
          {
            type: 'docSidebar',
            sidebarId: 'learning',
            position: 'left',
            label: '学习',
          },
          {
            type: 'docSidebar',
            sidebarId: 'developing',
            position: 'left',
            label: '开发',
          },
          { to: '/blog', label: '博客', position: 'left' },
          // {
          //   type: 'docsVersionDropdown',
          //   position: 'right',
          // },
          {
            href: 'https://github.com/biulight/blog',
            label: 'GitHub',
            position: 'right',
          },
          { href: 'https://blog.biulight.cn/timeline/blog/rss.xml', label: 'RSS', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: '产品手册',
                to: '/products',
              },
              {
                label: '知识库',
                to: '/knowledge',
              },
              {
                label: '前端',
                to: '/frontend',
              },
            ],
          },
          // {
          //   title: 'Community',
          //   items: [
          //     {
          //       label: 'Stack Overflow',
          //       href: 'https://stackoverflow.com/questions/tagged/docusaurus',
          //     },
          //     {
          //       label: 'Discord',
          //       href: 'https://discordapp.com/invite/docusaurus',
          //     },
          //     {
          //       label: 'Twitter',
          //       href: 'https://twitter.com/docusaurus',
          //     },
          //   ],
          // },
          {
            title: 'More',
            items: [
              {
                label: '博客',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/biulight/blog',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Biulight. Built with Docusaurus.<br /><a href="//beian.miit.gov.cn">苏ICP备2020068292号-3</a>`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
      },
      algolia: {
        // Algolia 提供的应用 ID
        appId: 'YHLGHU6YJW',
        //  公开 API 密钥：提交它没有危险
        apiKey: 'a2e1086e4eb8f15bcd10b7e5a892a8e2',
        indexName: 'biulight',
        // 可选：见下文
        contextualSearch: true,
        // 可选：Algolia 搜索参数
        searchParameters: {},
        // 可选：默认启用的搜索页路径（传递 `false` 以禁用它）
        searchPagePath: 'search',
        // 可选：Docsearch 的 insights 功能是否启用（默认为 `false`）
        insights: false,
        //... 其他 Algolia 参数
      },
    }),
};

module.exports = config;
