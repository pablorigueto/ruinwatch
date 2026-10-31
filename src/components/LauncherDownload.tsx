import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LauncherDownload() {
  const { t } = useTranslation();
  return <div className="launcher-download">
    <button type="button" disabled className="launcher-download-button">
      <Download size={18} aria-hidden="true" />
      <span>{t('events.launcherDownload')}</span>
    </button>
    <p>{t('events.launcherAvailability')}</p>
  </div>;
}
