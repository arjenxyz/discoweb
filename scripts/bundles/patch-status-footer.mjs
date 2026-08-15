import fs from 'fs';

const p = 'app/status/StatusPageClient.tsx';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  `            DiscoWeb sistem durumu sayfası{' '}
            <a
              href="https://discordstatus.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5865F2] hover:underline"
            >
              Discord Status
            </a>{' '}
            tasarımından esinlenilmiştir.`,
  `{t('status.footer_inspired_before')}{' '}
            <a
              href="https://discordstatus.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5865F2] hover:underline"
            >
              Discord Status
            </a>{' '}
            {t('status.footer_inspired_after')}`,
);

s = s.replace(
  `            Sorun bildirmek için{' '}
            <a
              href={siteConfig.links.support}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5865F2] hover:underline"
            >
              Discord destek sunucusunu
            </a>{' '}
            kullanın. Veriler {REFRESH_MS / 1000} saniyede bir güncellenir.`,
  `{t('status.footer_report_before')}{' '}
            <a
              href={siteConfig.links.support}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5865F2] hover:underline"
            >
              {t('status.footer_report_link')}
            </a>{' '}
            {t('status.footer_report_after', { seconds: REFRESH_MS / 1000 })}`,
);

fs.writeFileSync(p, s);
console.log('footer patched', /[ğüşıöçĞÜŞİÖÇ]/.test(fs.readFileSync(p, 'utf8')) ? 'still has TR' : 'clean');
