import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [btcPrice, setBtcPrice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testPrice, setTestPrice] = useState(null)
  const [isTestMode, setIsTestMode] = useState(false)

  // 대출 정보
  const LOAN_DATE = new Date('2025-11-29') // 대출 시작일
  const LOAN_AMOUNT = 120000000 // 대출 원금: 1.2억원
  const BTC_AMOUNT = 0.88 // BTC 수량
  const BTC_PRICE_AT_LOAN = 136480000 // 당시 BTC 가격
  const MONTHLY_INTEREST = 600000 // 월이자: 60만원
  const INTEREST_PAYMENT_DAY = 25 // 이자 입금일: 매달 25일

  // 테스트 가격 적용 함수
  const applyTestPrice = (price) => {
    if (price && price > 0) {
      setTestPrice(price)
      setIsTestMode(true)
      // 테스트 모드: 가짜 데이터 생성
      const mockData = {
        market: 'KRW-BTC',
        trade_price: price,
        timestamp: Date.now(),
        signed_change_rate: 0,
        acc_trade_price_24h: 0
      }
      setBtcPrice(mockData)
      setLoading(false)
      setError(null)
      console.log('🧪 테스트 모드 활성화: BTC 가격 =', price.toLocaleString('ko-KR'), '원')
    }
  }

  // 테스트 모드 해제 함수
  const disableTestMode = () => {
    setIsTestMode(false)
    setTestPrice(null)
    // 실제 가격 다시 가져오기
    fetchBtcPrice()
  }

  // Upbit API에서 Bitcoin 가격 가져오기
  const fetchBtcPrice = async () => {
    // 테스트 모드면 API 호출 안 함
    if (isTestMode && testPrice) {
      return
    }

    try {
      setLoading(true)
      
      // 개발 환경에서는 별도 프록시 서버 또는 Vite 프록시 사용, 프로덕션에서는 서버리스 함수 사용
      let apiUrl
      if (import.meta.env.DEV) {
        // 개발 환경: 별도 프록시 서버 사용 (포트 3001) 또는 Vite 프록시
        // 프록시 서버가 실행 중이면 http://localhost:3001 사용, 아니면 Vite 프록시 사용
        const useProxyServer = false // true로 변경하면 별도 프록시 서버 사용
        if (useProxyServer) {
          apiUrl = 'http://localhost:3001/api/v1/ticker?markets=KRW-BTC'
        } else {
          apiUrl = '/api/v1/ticker?markets=KRW-BTC'
        }
      } else {
        // Vercel 서버리스 함수
        apiUrl = '/api/proxy'
      }
      
      console.log('Fetching from:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
          console.error('Error response:', errorText)
        } catch (e) {
          console.error('Failed to read error response')
        }
        throw new Error(`가격 정보를 가져오는데 실패했습니다. (상태: ${response.status})`)
      }
      
      const data = await response.json()
      if (data && data.length > 0) {
        setBtcPrice(data[0])
        setError(null)
      } else {
        throw new Error('가격 데이터를 찾을 수 없습니다.')
      }
    } catch (err) {
      const errorMessage = err.message || '알 수 없는 오류가 발생했습니다.'
      setError(`${errorMessage} (자세한 내용은 브라우저 콘솔을 확인하세요)`)
      console.error('Error fetching BTC price:', err)
      console.error('API URL:', import.meta.env.DEV ? '/api/v1/ticker?markets=KRW-BTC' : '/api/proxy')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isTestMode) {
      fetchBtcPrice()
      // 10초마다 가격 업데이트
      const interval = setInterval(fetchBtcPrice, 10000)
      return () => clearInterval(interval)
    }
  }, [isTestMode])

  // 현재까지 받은 이자 계산 (매달 25일 입금)
  const calculateReceivedInterest = () => {
    const today = new Date()
    let interestCount = 0
    
    // 대출일 다음 달 25일부터 시작
    let paymentDate = new Date(LOAN_DATE)
    paymentDate.setMonth(paymentDate.getMonth() + 1)
    paymentDate.setDate(INTEREST_PAYMENT_DAY)
    
    // 오늘까지의 이자 입금 횟수 계산
    while (paymentDate <= today) {
      interestCount++
      paymentDate.setMonth(paymentDate.getMonth() + 1)
    }
    
    return interestCount * MONTHLY_INTEREST
  }

  // 상환 금액 계산
  const calculateRepayment = () => {
    if (!btcPrice) return null

    const currentBtcPrice = btcPrice.trade_price
    const receivedInterest = calculateReceivedInterest()
    
    // 현재 BTC 가격이 당시 가격보다 높은 경우
    if (currentBtcPrice > BTC_PRICE_AT_LOAN) {
      // 0.88개를 다시 확보하기 위한 금액
      const btcValueAtCurrentPrice = currentBtcPrice * BTC_AMOUNT
      // 추가금 = (현재 BTC 가격으로 0.88개 구매 비용) - 원금
      const additionalAmount = btcValueAtCurrentPrice - LOAN_AMOUNT
      // 기본적으로는 이자를 차감하지 않지만, 추가금이 이자보다 높을 때만 이자 차감
      let repaymentAmount
      if (additionalAmount > receivedInterest) {
        // 추가금이 이자보다 높으면 이자 차감
        repaymentAmount = LOAN_AMOUNT + additionalAmount - receivedInterest
      } else {
        // 추가금이 이자보다 낮거나 같으면 이자 차감 안 함
        repaymentAmount = LOAN_AMOUNT + additionalAmount
      }
      // 최소 상환 금액은 원금(1.2억원) 이상이어야 함
      repaymentAmount = Math.max(LOAN_AMOUNT, repaymentAmount)
      
      return {
        repaymentAmount: repaymentAmount,
        receivedInterest,
        additionalAmount,
        scenario: 'high',
        btcValueAtCurrentPrice
      }
    } else {
      // 현재 BTC 가격이 당시 가격보다 낮거나 같은 경우
      // 원금만 상환, 이자는 이미 받았으므로 빼지 않음
      // 최종 상환 금액은 항상 원금(1.2억원) 이상이어야 함
      const repaymentAmount = LOAN_AMOUNT
      
      return {
        repaymentAmount: repaymentAmount, // 항상 원금과 동일 (1.2억원)
        receivedInterest,
        additionalAmount: 0,
        scenario: 'low',
        btcValueAtCurrentPrice: currentBtcPrice * BTC_AMOUNT
      }
    }
  }

  const repaymentInfo = calculateRepayment()
  const receivedInterest = calculateReceivedInterest()
  const interestCount = Math.floor(receivedInterest / MONTHLY_INTEREST)

  return (
    <div className="app">
      <header className="app-header">
        <h1>대출 상환 계산기</h1>
        <p className="subtitle">Bitcoin 가격 기반 상환 금액 계산</p>
        {isTestMode && (
          <div className="test-mode-badge">
            🧪 테스트 모드: BTC 가격 = {testPrice?.toLocaleString('ko-KR')} 원
            <button 
              onClick={() => {
                window.location.href = window.location.pathname
                setIsTestMode(false)
                setTestPrice(null)
              }}
              className="test-mode-close"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {loading && !btcPrice && (
          <div className="loading">가격 정보를 불러오는 중...</div>
        )}

        {error && (
          <div className="error">
            <p>오류: {error}</p>
            <button onClick={fetchBtcPrice}>다시 시도</button>
          </div>
        )}

        {btcPrice && repaymentInfo && (
          <>
            {/* 대출 정보 */}
            <div className="loan-info">
              <h2>대출 정보</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">대출일</span>
                  <span className="info-value">{LOAN_DATE.toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">대출 원금</span>
                  <span className="info-value">{LOAN_AMOUNT.toLocaleString('ko-KR')} 원</span>
                </div>
                <div className="info-item">
                  <span className="info-label">당시 BTC 가격</span>
                  <span className="info-value">{BTC_PRICE_AT_LOAN.toLocaleString('ko-KR')} 원</span>
                </div>
                <div className="info-item">
                  <span className="info-label">BTC 수량 (판매)</span>
                  <span className="info-value">{BTC_AMOUNT} BTC</span>
                </div>
                <div className="info-item">
                  <span className="info-label">월이자</span>
                  <span className="info-value">{MONTHLY_INTEREST.toLocaleString('ko-KR')} 원</span>
                </div>
                <div className="info-item">
                  <span className="info-label">납입 이자 횟수</span>
                  <span className="info-value">{interestCount}회</span>
                </div>
                <div className="info-item">
                  <span className="info-label">누적 납입 이자</span>
                  <span className="info-value highlight">{receivedInterest.toLocaleString('ko-KR')} 원</span>
                </div>
              </div>
            </div>

            {/* 상환 계산 결과 */}
            <div className={`repayment-result ${repaymentInfo.scenario === 'high' ? 'scenario-high' : 'scenario-low'}`}>
              <h2>상환 금액 계산</h2>
              
              {repaymentInfo.scenario === 'high' ? (
                <div className="scenario-box">
                  <div className="scenario-title">📈 시나리오: BTC 가격 상승</div>
                  <div className="scenario-desc">
                    현재 BTC 가격이 당시 가격보다 높아, 0.88개를 다시 확보하기 위한 추가금이 필요합니다.
                  </div>
                </div>
              ) : (
                <div className="scenario-box">
                  <div className="scenario-title">📉 시나리오: BTC 가격 하락/동일</div>
                  <div className="scenario-desc">
                    기존 납부 이자와 원금만 상환합니다.
                  </div>
                </div>
              )}

              <div className="calculation-details">
                {repaymentInfo.scenario === 'high' ? (
                  <>
                    <div className="calc-row">
                      <span className="calc-label">대출 원금</span>
                      <span className="calc-value">{LOAN_AMOUNT.toLocaleString('ko-KR')} 원</span>
                    </div>
                    <div className="calc-row">
                      <span className="calc-label">현재 BTC 가격으로 0.88개 구매 비용</span>
                      <span className="calc-value">{Math.round(repaymentInfo.btcValueAtCurrentPrice).toLocaleString('ko-KR')} 원</span>
                    </div>
                    <div className="calc-row">
                      <span className="calc-label">추가금 (0.88개 재구매 비용 - 원금)</span>
                      <span className="calc-value highlight">{Math.round(repaymentInfo.additionalAmount).toLocaleString('ko-KR')} 원</span>
                    </div>
                    {repaymentInfo.additionalAmount > receivedInterest ? (
                      <div className="calc-row">
                        <span className="calc-label">누적 납입 이자</span>
                        <span className="calc-value">- {receivedInterest.toLocaleString('ko-KR')} 원</span>
                      </div>
                    ) : (
                      <div className="calc-row info-note">
                        <span className="calc-label">※ 추가금이 이자보다 낮아 이자는 차감하지 않습니다.</span>
                      </div>
                    )}
                    <div className="calc-divider"></div>
                    <div className="calc-row final">
                      <span className="calc-label">최종 상환 금액</span>
                      <span className="calc-value final-amount">
                        {Math.round(repaymentInfo.repaymentAmount).toLocaleString('ko-KR')} 원
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="calc-row">
                      <span className="calc-label">대출 원금</span>
                      <span className="calc-value">{LOAN_AMOUNT.toLocaleString('ko-KR')} 원</span>
                    </div>
                    <div className="calc-divider"></div>
                    <div className="calc-row final">
                      <span className="calc-label">최종 상환 금액</span>
                      <span className="calc-value final-amount">
                        {Math.round(repaymentInfo.repaymentAmount).toLocaleString('ko-KR')} 원
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 현재 BTC 가격 표시 */}
            <div className="price-display">
              <div className="current-price">
                <span className="price-label">현재 Bitcoin 가격</span>
                <span className="price-value">
                  {btcPrice.trade_price.toLocaleString('ko-KR')} 원
                </span>
              </div>
              <div className="price-comparison">
                <div className="comparison-item">
                  <span className="comparison-label">당시 BTC 가격 (대출일)</span>
                  <span className="comparison-value">{BTC_PRICE_AT_LOAN.toLocaleString('ko-KR')} 원</span>
                </div>
                <div className={`price-diff ${btcPrice.trade_price > BTC_PRICE_AT_LOAN ? 'positive' : 'negative'}`}>
                  {btcPrice.trade_price > BTC_PRICE_AT_LOAN ? '↑' : '↓'} 
                  {Math.abs(btcPrice.trade_price - BTC_PRICE_AT_LOAN).toLocaleString('ko-KR')} 원
                  ({((btcPrice.trade_price / BTC_PRICE_AT_LOAN - 1) * 100).toFixed(2)}%)
                </div>
              </div>
              <div className="last-update">
                마지막 업데이트: {new Date(btcPrice.timestamp).toLocaleString('ko-KR')}
              </div>
            </div>
          </>
        )}

        {/* 테스트 가격 입력 섹션 */}
        <div className="test-price-section">
          <h3>🧪 테스트 모드</h3>
          <p className="test-description">임의의 BTC 가격을 입력하여 계산 결과를 테스트할 수 있습니다.</p>
          <div className="test-input-group">
            <input
              type="number"
              placeholder="테스트할 BTC 가격 입력 (예: 150000000)"
              className="test-price-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const price = parseFloat(e.target.value)
                  if (!isNaN(price) && price > 0) {
                    applyTestPrice(price)
                  }
                }
              }}
            />
            <div className="test-buttons">
              <button
                onClick={() => {
                  const input = document.querySelector('.test-price-input')
                  const price = parseFloat(input.value)
                  if (!isNaN(price) && price > 0) {
                    applyTestPrice(price)
                  } else {
                    alert('올바른 가격을 입력해주세요.')
                  }
                }}
                className="test-apply-btn"
              >
                적용
              </button>
              {isTestMode && (
                <button
                  onClick={disableTestMode}
                  className="test-reset-btn"
                >
                  실제 가격으로 복원
                </button>
              )}
            </div>
          </div>
          {isTestMode && (
            <div className="test-active-notice">
              ✓ 테스트 모드 활성화 중: BTC 가격 = {testPrice?.toLocaleString('ko-KR')} 원
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>데이터 출처: Upbit API | 10초마다 자동 업데이트</p>
      </footer>
    </div>
  )
}

export default App
