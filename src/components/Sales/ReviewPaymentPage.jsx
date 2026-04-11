import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { PaymentStatus } from './PaymentStatus'; // Assuming PaymentStatus is a component managing the status indicators

const ReviewPaymentPage = ({ discount, paymentMethods }) => {
    const totalAmount = useMemo(() => {
        // Improved calculation logic
        return calculateTotalAmount(paymentMethods, discount);
    }, [paymentMethods, discount]);

    const handlePayment = useCallback((method) => {
        // Process payment with the selected method
        console.log(`Processing payment through ${method}`);
    }, []);

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Review Your Payment
            </Typography>
            <Typography variant="h6" gutterBottom>
                Total Amount: ${totalAmount}
            </Typography>
            {paymentMethods.map((method) => (
                <Card key={method.id} style={{ margin: '10px 0', border: method.status === 'active' ? '2px solid green' : '2px solid grey' }}>
                    <CardContent>
                        <Typography variant="h5">
                            {method.name}
                        </Typography>
                        <PaymentStatus status={method.status} />
                        <Button onClick={() => handlePayment(method.name)} disabled={method.status !== 'active'}>
                            Pay with {method.name}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const calculateTotalAmount = (paymentMethods, discount) => {
    // Calculation function with enhanced logic
    const baseAmount = paymentMethods.reduce((total, method) => total + method.amount, 0);
    return baseAmount - (baseAmount * (discount / 100));
};

ReviewPaymentPage.propTypes = {
    discount: PropTypes.number.isRequired,
    paymentMethods: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
    })).isRequired,
};

export default ReviewPaymentPage;