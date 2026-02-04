import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Início',
    },
    {
      type: 'doc',
      id: 'readme',
      label: 'Sobre o Projeto',
    },
    {
      type: 'category',
      label: 'Infraestrutura',
      items: ['vps'],
    },
    {
      type: 'category',
      label: 'QualCarreira',
      items: [
        'qual-carreira-seguir/architecture',
        'qual-carreira-seguir/integrations',
        'qual-carreira-seguir/deploy',
        'qual-carreira-seguir/contextual-questionnaire-structure',
        'qual-carreira-seguir/experiment-setup-guide',
        'qual-carreira-seguir/gtm-status',
        'qual-carreira-seguir/whatsapp-waapi-implementation',
        'qual-carreira-seguir/carreiras-e-indices',
      ],
    },
    {
      type: 'category',
      label: 'Dashboard',
      items: [
        'dashboard/readme',
        'dashboard/architecture',
        'dashboard/setup-and-deploy',
        'dashboard/edge-functions',
        'dashboard/features',
        'dashboard/troubleshooting',
      ],
    },
  ],
};

export default sidebars;
