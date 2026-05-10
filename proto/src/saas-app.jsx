// SaaS app entry — routing landing/signin/signup + tweaks panel

const SAAS_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "heroVariant": "bold",
  "showLogos": true,
  "showFeatures": true,
  "showUseCases": true,
  "showIntegrations": true,
  "showMetrics": true,
  "showTestimonials": true,
  "showFAQ": true,
  "showCta": true
}/*EDITMODE-END*/;

function SaasApp() {
  const [t, setTweak] = useTweaks(SAAS_TWEAKS);
  const [route, setRoute] = React.useState(() => {
    const h = (location.hash || '').replace('#', '');
    return ['landing','signin','signup','forgot'].includes(h) ? h : 'landing';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  const goto = (r) => {
    if (r === 'app') { location.href = 'BugForge.html'; return; }
    setRoute(r);
    location.hash = r;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  React.useEffect(() => {
    const onHash = () => {
      const h = (location.hash || '').replace('#', '');
      if (['landing','signin','signup','forgot'].includes(h)) setRoute(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div data-screen-label={`SaaS / ${route}`}>
      {route === 'landing' && (
        <>
          <SaasNav goto={goto} theme={t.theme} setTheme={(v) => setTweak('theme', v)}/>
          <Hero variant={t.heroVariant} goto={goto}/>
          {t.showFeatures && <Features/>}
          {t.showUseCases && <UseCases/>}
          {t.showMetrics && <MetricsSection/>}
          {t.showIntegrations && <Integrations/>}
          {t.showTestimonials && <Testimonials/>}
          {t.showFAQ && <FAQ/>}
          {t.showCta && <CtaStrip goto={goto}/>}
          <Footer/>
        </>
      )}
      {route === 'signin' && <SignIn goto={goto}/>}
      {route === 'signup' && <SignUp goto={goto}/>}
      {route === 'forgot' && <ForgotPassword goto={goto}/>}

      <TweaksPanel title="SaaS · Tweaks">
        <TweakSection label="Тема">
          <TweakRadio label="Режим" value={t.theme}
            options={[{value:'light',label:'☀ Light'},{value:'dark',label:'☾ Dark'}]}
            onChange={(v) => setTweak('theme', v)}/>
        </TweakSection>
        <TweakSection label="Екран">
          <TweakSelect label="Сторінка" value={route}
            options={[{value:'landing',label:'Landing'},{value:'signin',label:'Sign In'},{value:'signup',label:'Sign Up'},{value:'forgot',label:'Forgot password'}]}
            onChange={(v) => goto(v)}/>
        </TweakSection>
        {route === 'landing' && (
          <>
            <TweakSection label="Hero">
              <TweakRadio label="Варіант" value={t.heroVariant}
                options={[{value:'bold',label:'Bold'},{value:'calm',label:'Calm'},{value:'dev',label:'Dev'}]}
                onChange={(v) => setTweak('heroVariant', v)}/>
            </TweakSection>
            <TweakSection label="Секції">
              <TweakToggle label="Можливості" value={t.showFeatures} onChange={(v) => setTweak('showFeatures', v)}/>
              <TweakToggle label="Для кого" value={t.showUseCases} onChange={(v) => setTweak('showUseCases', v)}/>
              <TweakToggle label="Метрики" value={t.showMetrics} onChange={(v) => setTweak('showMetrics', v)}/>
              <TweakToggle label="Інтеграції" value={t.showIntegrations} onChange={(v) => setTweak('showIntegrations', v)}/>
              <TweakToggle label="Відгуки" value={t.showTestimonials} onChange={(v) => setTweak('showTestimonials', v)}/>
              <TweakToggle label="FAQ" value={t.showFAQ} onChange={(v) => setTweak('showFAQ', v)}/>
              <TweakToggle label="CTA-блок" value={t.showCta} onChange={(v) => setTweak('showCta', v)}/>
            </TweakSection>
          </>
        )}
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SaasApp/>);
