// 이건 초기 접속 시 클릭 한번으로 F11 적용하는 코드
// resetInactivityTimer함수는 현재 15초 기준으로 원상태 복귀 코드 해놓은거

// document.addEventListener('DOMContentLoaded', () => {
//     document.body.addEventListener('click', () => {
//       const elem = document.documentElement;
//       if (elem.requestFullscreen) {
//         elem.requestFullscreen();
//       } else if (elem.webkitRequestFullscreen) { 
//         elem.webkitRequestFullscreen();
//       } else if (elem.msRequestFullscreen) { // 
//         elem.msRequestFullscreen();
//       }
//     }, { once: true }); 
//   });
  

function updateTime() {
    const now = new Date();
  
    const timeStr = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  
    const dateStr = now.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  
    document.getElementById('clock').innerHTML = `
      <div class="date-text">${dateStr}</div>
      <div class="time-text">${timeStr}</div>
    `;
}
setInterval(updateTime, 1000);
updateTime();
  
const container = document.getElementById('mainContainer');

let resetTimeout;

function expandView() {
    container.classList.add('expanded');
    document.querySelector('.stress-graph').classList.remove('hidden');
    document.querySelector('.sleep-details').classList.remove('hidden');
    document.querySelector('.sitting-total').classList.remove('hidden');
    resetInactivityTimer();
}
  
function collapseView() {
    container.classList.remove('expanded');
    document.querySelector('.stress-graph').classList.add('hidden');
    document.querySelector('.sleep-details').classList.add('hidden');
    document.querySelector('.sitting-total').classList.add('hidden');
}
  
function resetInactivityTimer() {
    clearTimeout(resetTimeout);
    if (container.classList.contains('expanded')) {
      resetTimeout = setTimeout(() => {
        collapseView();
      }, 15000);
    }
}
  
document.addEventListener('click', () => {
    if (!container.classList.contains('expanded')) {
      expandView();
    } else {
      resetInactivityTimer();
    }
});

/*
Fitbit 데이터 활용 부분

!! 스트레스 지수 : stressChartData -> Datasets -> data에 저장
createStressChart 함수: 초반 차트 생성 (0으로 초기화)

1) chart update
/////////////////////////
updateStressChart

1. parameter: stressData(fetchFitbitData 함수에서 api로 호출함 이건 서버에서 전처리하고 수치로 전달되는 방식)
2. 예상 operate: API가 최근 5개의 스트레스 지수로 구성
3. 현재 함수는 차트 업데이트, 배열 슬라이싱만 구현
4. 이후 5개의 스트레스 지수를 차트의 data로 구성하는 방법 필요
/////////////////////////

2) sleep update
/////////////////////////
updateSleepCard

1. parameter: sleepData(stress와 동일)
2. 예상 operate: API가 전날 총합, 5일 평균, 권장 휴식시간으로 구성
3. 현재 함수는 업데이트되는 텍스트, 사용 예정 변수만 구상되어 있음
4. 이후 전달 받은 데이터로 내부 변수 값을 초기화하는 방법 필요
/////////////////////////

fitbit 데이터 업데이트는 10분 단위로 해놓음
*/

let stressChart;

const stressChartData = {
  labels: ['5시간 전', '4시간 전', '3시간 전', '2시간 전', '1시간 전'],
  datasets: [
    {
      label: '스트레스 지수',
      data: [0, 0, 0, 0, 0],
      fill: true,
      backgroundColor: 'rgba(128, 128, 128, 0.2)',
      borderColor: 'grey',
      borderWidth: 1.2,
      tension: 0.4,
      pointRadius: 2,
      pointBackgroundColor: 'grey'
    }
  ]
};

function createStressChart() {
  const ctx = document.getElementById('stressChart').getContext('2d');
  stressChart = new Chart(ctx, {
    type: 'line',
    data: stressChartData,
    options: {
      responsive: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            font: {
              family: 'Poppins',
              size: 10
            }
          }
        },
        x: {
          ticks: {
            font: {
              family: 'Poppins',
              size: 10
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function updateStressChart(stressData) {
    const values = stressData;
    // stressChartData.datasets[0].data = values.slice(-5);
    stressChartData.datasets[0].data = values;
    console.log(values);
    stressChart.update();
}

function updateSleepCard(sleepData) {
    const hours = sleepData.hour, minutes = sleepData.minutes;
    const avgHours = sleepData.avgHours, avgMins = sleepData.avgMins;
    const restAdvice = sleepData.restAdvice;
  document.querySelector('.last-sleep').textContent = `전날 수면: ${hours}시간 ${minutes}분`;
  document.querySelector('.avg-sleep').textContent = `최근 평균: ${avgHours}시간 ${avgMins}분`;
  document.querySelector('.sleep-advice').textContent = `50분당 ${restAdvice}분 휴식`;
}

async function fetchFitbitData() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const [stressRes, sleepRes] = await Promise.all([
      fetch('https://igongsa.shop/api/stress'),
      fetch('https://igongsa.shop/api/sleep')
    ]);

    const stressData = await stressRes.json();
    const sleepData = await sleepRes.json();

    console.log(stressData);
    console.log(sleepData);

    // const stressData = [0, 0, 0, 0, 0];
    // const sleepData = [];

    updateStressChart(stressData);
    updateSleepCard(sleepData);

  } catch (err) {
    console.error('Fitbit 데이터 불러오기 실패:', err);
  }
}

window.onload = () => {
  createStressChart();
  
  window.open(
    'https://igongsa.shop/api/start',
    'fitbit_oauth',
    'width=600,height=700,top=100,left=100,resizable=yes,scrollbars=yes'
  );


  fetchFitbitData();
  setInterval(fetchFitbitData, 600000); // 10분 간격
};
