import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight,
  CheckCircle, AlertCircle, Clock, X, ChevronRight,
} from 'lucide-react'
import { getToken, getUser } from '../lib/auth'
import { apiFetch } from '../lib/api'
import styles from './wallet.module.css'

interface Transaction {
  _id:         string
  type:        'credit' | 'debit'
  amount:      number
  description: string
  status:      'success' | 'pending' | 'failed'
  createdAt:   string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

const QUICK_AMOUNTS = [100, 500, 1000, 2000]

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.querySelector('script[src*="razorpay"]')) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function WalletPage() {
  const navigate = useNavigate()

  const [balance,       setBalance]       = useState(0)
  const [transactions,  setTransactions]  = useState<Transaction[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showAdd,       setShowAdd]       = useState(false)
  const [addAmt,        setAddAmt]        = useState('')
  const [addErr,        setAddErr]        = useState('')
  const [adding,        setAdding]        = useState(false)
  const [successMsg,    setSuccessMsg]    = useState('')

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return }
    fetchWallet()
  }, [navigate])

  const fetchWallet = async () => {
    try {
      const res  = await apiFetch('/api/wallet')
      const data = await res.json()
      if (res.ok) { setBalance(data.balance); setTransactions(data.transactions) }
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async () => {
    const amt = parseInt(addAmt)
    if (!addAmt || isNaN(amt) || amt < 10)  { setAddErr('Minimum ₹10'); return }
    if (amt > 50000)                          { setAddErr('Maximum ₹50,000'); return }

    setAdding(true); setAddErr('')

    const loaded = await loadRazorpayScript()
    if (!loaded) { setAddErr('Could not load payment gateway. Try again.'); setAdding(false); return }

    const res   = await apiFetch('/api/wallet/add', {
      method: 'POST',
      body:   JSON.stringify({ amount: amt }),
    })
    const order = await res.json()
    if (!res.ok) { setAddErr(order.error || 'Failed to create order'); setAdding(false); return }

    const user = getUser()
    const token = getToken()

    const rzp = new window.Razorpay({
      key:         order.keyId,
      amount:      order.amount * 100,
      currency:    order.currency,
      name:        'Parko',
      description: 'Add money to wallet',
      order_id:    order.orderId,
      prefill: { name: user?.name || '', email: user?.email || '' },
      theme: { color: '#00e5a0' },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const vRes = await apiFetch('/api/wallet/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            amount:            amt,
          }),
        })
        const vData = await vRes.json()
        if (vRes.ok) {
          setBalance(vData.balance)
          setShowAdd(false)
          setAddAmt('')
          setSuccessMsg(`₹${amt} added to your wallet!`)
          setTimeout(() => setSuccessMsg(''), 4000)
          fetchWallet()
        } else {
          setAddErr(vData.error || 'Payment verification failed')
        }
        setAdding(false)
      },
      modal: { ondismiss: () => setAdding(false) },
    })
    rzp.open()
    void token
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text3)' }}>Loading…</div>

  return (
    <div className="page-wrapper">
      <div className={styles.header}>
        <div className={styles.headerIcon}><Wallet size={22} /></div>
        <div>
          <h1 className={styles.headerTitle}>My Wallet</h1>
          <p className={styles.headerSub}>Add money and pay for bookings instantly</p>
        </div>
      </div>

      {successMsg && (
        <div className={styles.successToast}>
          <CheckCircle size={16} />{successMsg}
        </div>
      )}

      <div className={styles.grid}>
        <div className={`card ${styles.balanceCard} animate-fadeUp`}>
          <p className={styles.balanceLabel}>Available Balance</p>
          <div className={styles.balanceAmt}>₹{balance.toLocaleString('en-IN')}</div>
          <p className={styles.balanceSub}>Use this balance to book parking spots</p>

          <button className={`btn-primary ${styles.addBtn}`} onClick={() => { setShowAdd(true); setAddErr(''); setAddAmt('') }}>
            <Plus size={16} /> Add Money
          </button>

          <div className={styles.balanceNote}>
            <CheckCircle size={12} />
            Instant credit · Secure via Razorpay
          </div>
        </div>

        <div className={`card animate-fadeUp delay-1 ${styles.howCard}`}>
          <h3 className={styles.howTitle}>How it works</h3>
          <div className={styles.steps}>
            {[
              { n: '1', t: 'Add Money',   s: 'Top up your wallet using Razorpay' },
              { n: '2', t: 'Book a Spot', s: 'Choose a parking spot & time' },
              { n: '3', t: 'Auto Deduct', s: 'Payment deducted from wallet instantly' },
            ].map(step => (
              <div key={step.n} className={styles.step}>
                <div className={styles.stepNum}>{step.n}</div>
                <div>
                  <div className={styles.stepTitle}>{step.t}</div>
                  <div className={styles.stepSub}>{step.s}</div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/search-parking" className={styles.findLink}>
            Find parking spots <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className={`card animate-fadeUp delay-2 ${styles.txCard}`}>
        <h2 className={styles.txTitle}>Transaction History</h2>
        {transactions.length === 0 ? (
          <div className={styles.txEmpty}>
            <Wallet size={32} />
            <p>No transactions yet</p>
            <span>Add money to get started</span>
          </div>
        ) : (
          <div className={styles.txList}>
            {transactions.map(tx => (
              <div key={tx._id} className={styles.txRow}>
                <div className={`${styles.txIcon} ${tx.type === 'credit' ? styles.txIconCredit : styles.txIconDebit}`}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className={styles.txInfo}>
                  <div className={styles.txDesc}>{tx.description}</div>
                  <div className={styles.txDate}>{formatDate(tx.createdAt)}</div>
                </div>
                <div className={styles.txRight}>
                  <div className={`${styles.txAmt} ${tx.type === 'credit' ? styles.txAmtCredit : styles.txAmtDebit}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                  <div className={`${styles.txStatus} ${styles[`txStatus_${tx.status}`]}`}>
                    {tx.status === 'success' ? <CheckCircle size={11} /> : tx.status === 'pending' ? <Clock size={11} /> : <AlertCircle size={11} />}
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <>
          <div className={styles.backdrop} onClick={() => { if (!adding) setShowAdd(false) }} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrap}><Plus size={20} /></div>
              <div>
                <h2 className={styles.modalTitle}>Add Money</h2>
                <p className={styles.modalSub}>Secure payment via Razorpay</p>
              </div>
              {!adding && <button className={styles.modalClose} onClick={() => setShowAdd(false)}><X size={16} /></button>}
            </div>

            <div className={styles.modalBody}>
              <div className={styles.quickRow}>
                {QUICK_AMOUNTS.map(q => (
                  <button
                    key={q}
                    className={`${styles.quickBtn} ${addAmt === String(q) ? styles.quickBtnActive : ''}`}
                    onClick={() => { setAddAmt(String(q)); setAddErr('') }}
                  >
                    ₹{q}
                  </button>
                ))}
              </div>

              <div className={styles.amtField}>
                <label className="label">Or enter custom amount</label>
                <div className={styles.amtInputWrap}>
                  <span className={styles.rupeeSign}>₹</span>
                  <input
                    className="input"
                    type="number"
                    min={10}
                    max={50000}
                    placeholder="0"
                    value={addAmt}
                    onChange={e => { setAddAmt(e.target.value); setAddErr('') }}
                    style={{ paddingLeft: 32 }}
                  />
                </div>
                {addErr && <span className={styles.fieldErr}>{addErr}</span>}
              </div>

              <p className={styles.amtNote}>Min ₹10 · Max ₹50,000 per transaction</p>
            </div>

            <div className={styles.modalFooter}>
              <button className="btn-outline" onClick={() => setShowAdd(false)} disabled={adding}>Cancel</button>
              <button className="btn-primary" onClick={handleAddMoney} disabled={adding || !addAmt} style={{ flex: 2 }}>
                {adding ? 'Opening payment…' : `Pay ₹${addAmt || '0'} via Razorpay`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
