import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import DownArrowIcon from 'src/assets/down-arrow.svg';
import Winection from 'src/assets/winection.svg';
import styles from './AboutPage.module.scss';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    id: 'intro',
    title: 'We-connent:',
    subtitle: '변화를 두려워하지 않는 사람들이',
    description: '서로 연결되어 세상을 바꾸는 힘을 만듭니다.'
  },
  {
    id: 'problem',
    title: '소통의 벽을 마주한 농인들',
    subtitle: '우리는 질문했습니다.',
    description: '어떻게 하면 그 벽을 허물 수 있을까? 그리고 마침내, 해답을 찾았습니다.'
  },
  {
    id: 'solution',
    title: 'Winection으로',
    subtitle: '당신의 세상과 이어지는 새로운 연결',
    description: '기술로 경계를 허물고, 모두가 함께하는 세상을 만들어갑니다.'
  }
];

export default function AboutPage() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState('intro');

  const observers = sections.map((section) => {
    const [ref, inView] = useInView({ threshold: 0.2 });
    return { id: section.id, ref, inView };
  });

  useEffect(() => {
    observers.forEach(({ id, inView }) => {
      if (inView) setCurrentSection(id);
    });
  }, [observers.map((obs) => obs.inView).join(',')]);

  return (
    <>
      <div className={styles['about-logo']} onClick={() => navigate('/')}>
        <Winection />
      </div>
      <div className={styles['about-page']}>
        {sections.map((section, index) => {
          const observer = observers[index];
          return (
              <section
                key={section.id}
                ref={observer.ref}
                className={`${styles['about-page__section']} ${currentSection === section.id ? styles['about-page__section--active'] : ''}`}
              >
                <h1 className={styles['about-page__title']}>{section.title}</h1>
                <h2 className={styles['about-page__subtitle']}>{section.subtitle}</h2>
                <p className={styles['about-page__description']}>{section.description}</p>
                
                {index < 2 && (
                <div className={styles['about-page__icon']}>
                  <DownArrowIcon />
                </div>
                )}
              </section>
          );
        })}
      </div>
    </>
  );
}
