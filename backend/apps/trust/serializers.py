from rest_framework import serializers
from apps.products.models import Product
from apps.reviews.models import Review
from apps.trust.models import ReviewScore, ProductTrustReport


class ReviewScoreSerializer(serializers.ModelSerializer):
    is_trusted = serializers.BooleanField(read_only=True)

    class Meta:
        model = ReviewScore
        fields = ['iso_prediction', 'iso_anomaly_score', 'is_trusted']


class ReviewSerializer(serializers.ModelSerializer):
    score = ReviewScoreSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'review_id', 'rating', 'review_title', 'content_clean',
            'verified_purchase', 'posted_at', 'score',
        ]


class ProductTrustReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTrustReport
        fields = [
            'total_reviews', 'fake_count', 'authenticity_rate',
            'raw_avg_rating', 'adjusted_rating', 'summary_text',
            'pros', 'cons', 'verdict', 'computed_at',
        ]


class ProductSerializer(serializers.ModelSerializer):
    trust_report = ProductTrustReportSerializer(read_only=True)

    class Meta:
        model = Product
        fields = ['asin', 'name', 'trust_report']
