/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import expect from '@kbn/expect';
import { SecurityService } from '../../../../common/services';
import { KibanaFunctionalTestDefaultProviders } from '../../../../types/providers';

// eslint-disable-next-line import/no-default-export
export default function({ getPageObjects, getService }: KibanaFunctionalTestDefaultProviders) {
  const esArchiver = getService('esArchiver');
  const security: SecurityService = getService('security');
  const PageObjects = getPageObjects(['common', 'console', 'security']);
  const appsMenu = getService('appsMenu');
  const testSubjects = getService('testSubjects');
  const grokDebugger = getService('grokDebugger');

  describe('security', () => {
    before(async () => {
      await esArchiver.load('empty_kibana');

      // ensure we're logged out so we can login as the appropriate users
      await PageObjects.security.forceLogout();
    });

    after(async () => {
      // logout, so the other tests don't accidentally run as the custom users we're testing below
      await PageObjects.security.forceLogout();
    });

    describe('global dev_tools all privileges', () => {
      before(async () => {
        await security.role.create('global_dev_tools_all_role', {
          kibana: [
            {
              feature: {
                dev_tools: ['all'],
              },
              spaces: ['*'],
            },
          ],
        });

        await security.user.create('global_dev_tools_all_user', {
          password: 'global_dev_tools_all_user-password',
          roles: ['global_dev_tools_all_role'],
          full_name: 'test user',
        });

        await PageObjects.security.login(
          'global_dev_tools_all_user',
          'global_dev_tools_all_user-password',
          {
            expectSpaceSelector: false,
          }
        );
      });

      after(async () => {
        await security.role.delete('global_dev_tools_all_role');
        await security.user.delete('global_dev_tools_all_user');
      });

      it('shows Dev Tools navlink', async () => {
        const navLinks = await appsMenu.readLinks();
        expect(navLinks.map((link: Record<string, string>) => link.text)).to.eql([
          'Dev Tools',
          'Management',
        ]);
      });

      it(`can navigate to console`, async () => {
        await PageObjects.common.navigateToApp('console');
        await testSubjects.existOrFail('console');
      });

      it(`can navigate to search profiler`, async () => {
        await PageObjects.common.navigateToApp('searchProfiler');
        await testSubjects.existOrFail('searchProfiler');
      });

      it(`can navigate to grok debugger`, async () => {
        await PageObjects.common.navigateToApp('grokDebugger');
        await grokDebugger.assertExists();
      });
    });

    describe('global dev_tools read-only privileges', () => {
      before(async () => {
        await security.role.create('global_dev_tools_read_role', {
          kibana: [
            {
              feature: {
                dev_tools: ['read'],
              },
              spaces: ['*'],
            },
          ],
        });

        await security.user.create('global_dev_tools_read_user', {
          password: 'global_dev_tools_read_user-password',
          roles: ['global_dev_tools_read_role'],
          full_name: 'test user',
        });

        await PageObjects.security.login(
          'global_dev_tools_read_user',
          'global_dev_tools_read_user-password',
          {
            expectSpaceSelector: false,
          }
        );
      });

      after(async () => {
        await security.role.delete('global_dev_tools_read_role');
        await security.user.delete('global_dev_tools_read_user');
      });

      it(`shows 'Dev Tools' navlink`, async () => {
        const navLinks = (await appsMenu.readLinks()).map(
          (link: Record<string, string>) => link.text
        );
        expect(navLinks).to.eql(['Dev Tools', 'Management']);
      });

      it(`can navigate to console`, async () => {
        await PageObjects.common.navigateToApp('console');
        await testSubjects.existOrFail('console');
      });

      it(`can navigate to search profiler`, async () => {
        await PageObjects.common.navigateToApp('searchProfiler');
        await testSubjects.existOrFail('searchProfiler');
      });

      it(`can navigate to grok debugger`, async () => {
        await PageObjects.common.navigateToApp('grokDebugger');
        await grokDebugger.assertExists();
      });
    });

    describe('no dev_tools privileges', () => {
      before(async () => {
        await security.role.create('no_dev_tools_privileges_role', {
          kibana: [
            {
              feature: {
                discover: ['all'],
              },
              spaces: ['*'],
            },
          ],
        });

        await security.user.create('no_dev_tools_privileges_user', {
          password: 'no_dev_tools_privileges_user-password',
          roles: ['no_dev_tools_privileges_role'],
          full_name: 'test user',
        });

        await PageObjects.security.login(
          'no_dev_tools_privileges_user',
          'no_dev_tools_privileges_user-password',
          {
            expectSpaceSelector: false,
          }
        );
      });

      after(async () => {
        await security.role.delete('no_dev_tools_privileges_role');
        await security.user.delete('no_dev_tools_privileges_user');
      });

      it(`doesn't show 'Dev Tools' navLink`, async () => {
        const navLinks = await appsMenu.readLinks();
        expect(navLinks.map((navLink: any) => navLink.text)).to.not.contain(['Dev Tools']);
      });

      it(`navigating to console redirect to homepage`, async () => {
        await PageObjects.common.navigateToUrl('console', '', {
          ensureCurrentUrl: false,
        });
        await testSubjects.existOrFail('homeApp', 10000);
      });

      it(`navigating to search profiler redirect to homepage`, async () => {
        await PageObjects.common.navigateToUrl('searchProfiler', '', {
          ensureCurrentUrl: false,
        });
        await testSubjects.existOrFail('homeApp', 10000);
      });

      it(`navigating to grok debugger redirect to homepage`, async () => {
        await PageObjects.common.navigateToUrl('grokDebugger', '', {
          ensureCurrentUrl: false,
        });
        await testSubjects.existOrFail('homeApp', 10000);
      });
    });
  });
}
