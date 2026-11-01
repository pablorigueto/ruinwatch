import { Download, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LAUNCHER_DOWNLOAD_URL } from '@/lib/site';

export default function LauncherDownload() {
  const { t } = useTranslation();
  const steps = t('events.launcherSteps', { returnObjects: true }) as string[];
  return <div className="launcher-download">
    <a href={LAUNCHER_DOWNLOAD_URL} className="launcher-download-button">
      <Download size={18} aria-hidden="true" />
      <span>{t('events.launcherDownload')}</span>
    </a>
    <p>{t('events.launcherAvailability')}</p>
    <details className="launcher-install-guide">
      <summary>{t('events.launcherGuideTitle')}<ChevronDown size={16} aria-hidden="true" /></summary>
      <div>
        <ol>{steps.map((step,i) => <li key={i}>{step}</li>)}</ol>
        <p className="launcher-folder-label">{t('events.launcherFolderTitle')}</p>
        <pre aria-label={t('events.launcherFolderTitle')}>{`DiabloIII275/
  RuinWatchLauncher.exe
  x64/
    Diablo III64.exe
  Data/`}</pre>
        <p>{t('events.launcherUpdates')}</p>
      </div>
    </details>
  </div>;
}
